create schema if not exists extensions;
create extension if not exists vector with schema extensions;
grant usage on schema extensions to service_role;

create table if not exists public.product_embeddings (
  product_id uuid primary key references public.products (id) on delete cascade,
  embedding extensions.vector(2048) not null,
  model text not null,
  source_document text not null,
  content_hash text not null,
  embedded_at timestamptz not null default now()
);

alter table public.product_embeddings enable row level security;
revoke all on table public.product_embeddings from public;
revoke all on table public.product_embeddings from anon;
revoke all on table public.product_embeddings from authenticated;

create or replace function public.build_product_embedding_source(p_product_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select concat_ws(
    E'\n',
    'Title: ' || product.title,
    case
      when nullif(btrim(product.product_type), '') is not null
        then 'Type: ' || btrim(product.product_type)
    end,
    case
      when nullif(btrim(coalesce(product.description ->> 'html', product.description::text)), '') is not null
        then 'Description: ' || btrim(coalesce(product.description ->> 'html', product.description::text))
    end,
    case
      when product.sizing_mode = 'none' then 'Sizing: No size selection required'
    end,
    case
      when product.size_chart is not null and product.size_chart <> '[]'::jsonb
        then 'Size chart: ' || product.size_chart::text
    end,
    case
      when categories.values is not null then 'Categories: ' || categories.values
    end,
    case
      when sizes.values is not null then 'Sizes: ' || sizes.values
    end,
    case
      when colors.values is not null then 'Colors: ' || colors.values
    end
  )
  from public.products product
  left join lateral (
    select string_agg(
      category.name || coalesce(' — ' || nullif(btrim(category.description), ''), ''),
      '; ' order by category.name, category.id
    ) as values
    from public.product_categories product_category
    join public.categories category on category.id = product_category.category_id
    where product_category.product_id = product.id
  ) categories on true
  left join lateral (
    select string_agg(option.value, ', ' order by option.value) as values
    from (
      select distinct nullif(btrim(variant.size), '') as value
      from public.product_variants variant
      where variant.product_id = product.id
    ) option
    where option.value is not null
  ) sizes on true
  left join lateral (
    select string_agg(option.value, ', ' order by option.value) as values
    from (
      select distinct nullif(btrim(variant.color), '') as value
      from public.product_variants variant
      where variant.product_id = product.id
    ) option
    where option.value is not null
  ) colors on true
  where product.id = p_product_id;
$$;

create or replace function public.delete_product_embedding(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text, 0));
  delete from public.product_embeddings where product_id = p_product_id;
end;
$$;

create or replace function public.invalidate_product_embedding_from_product()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.delete_product_embedding(new.id);
  return new;
end;
$$;

create or replace function public.invalidate_product_embedding_from_category()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_product_id uuid;
begin
  for affected_product_id in
    select product_category.product_id
    from public.product_categories product_category
    where product_category.category_id = new.id
    order by product_category.product_id
  loop
    perform public.delete_product_embedding(affected_product_id);
  end loop;
  return new;
end;
$$;

create or replace function public.invalidate_product_embedding_from_category_link()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_product_id uuid;
  affected_product_ids uuid[];
begin
  if tg_op = 'INSERT' then
    affected_product_ids := array[new.product_id];
  elsif tg_op = 'DELETE' then
    affected_product_ids := array[old.product_id];
  else
    affected_product_ids := array[old.product_id, new.product_id];
  end if;

  for affected_product_id in
    select distinct affected.product_id
    from unnest(affected_product_ids) as affected(product_id)
    order by affected.product_id
  loop
    perform public.delete_product_embedding(affected_product_id);
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.invalidate_product_embedding_from_variant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_product_id uuid;
  affected_product_ids uuid[];
begin
  if tg_op = 'INSERT' then
    affected_product_ids := array[new.product_id];
  elsif tg_op = 'DELETE' then
    affected_product_ids := array[old.product_id];
  elsif old.product_id is not distinct from new.product_id
    and old.size is not distinct from new.size
    and old.color is not distinct from new.color then
    return new;
  else
    affected_product_ids := array[old.product_id, new.product_id];
  end if;

  for affected_product_id in
    select distinct affected.product_id
    from unnest(affected_product_ids) as affected(product_id)
    order by affected.product_id
  loop
    perform public.delete_product_embedding(affected_product_id);
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invalidate_product_embedding_from_product on public.products;
create trigger trg_invalidate_product_embedding_from_product
  after update of title, description, product_type, sizing_mode, size_chart on public.products
  for each row
  when (
    old.title is distinct from new.title
    or old.description is distinct from new.description
    or old.product_type is distinct from new.product_type
    or old.sizing_mode is distinct from new.sizing_mode
    or old.size_chart is distinct from new.size_chart
  )
  execute function public.invalidate_product_embedding_from_product();

drop trigger if exists trg_invalidate_product_embedding_from_category on public.categories;
create trigger trg_invalidate_product_embedding_from_category
  after update of name, description on public.categories
  for each row
  when (
    old.name is distinct from new.name
    or old.description is distinct from new.description
  )
  execute function public.invalidate_product_embedding_from_category();

drop trigger if exists trg_invalidate_product_embedding_from_category_link on public.product_categories;
create trigger trg_invalidate_product_embedding_from_category_link
  after insert or update or delete on public.product_categories
  for each row execute function public.invalidate_product_embedding_from_category_link();

drop trigger if exists trg_invalidate_product_embedding_from_variant on public.product_variants;
create trigger trg_invalidate_product_embedding_from_variant
  after insert or delete or update of product_id, size, color on public.product_variants
  for each row execute function public.invalidate_product_embedding_from_variant();

create or replace function public.get_product_embedding_sources(p_limit integer default 100)
returns table (
  product_id uuid,
  source_document text,
  embedding_model text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'permission denied';
  end if;

  return query
  select
    product.id,
    source.document,
    'nvidia/nemotron-3-embed-1b:free'::text
  from public.products product
  cross join lateral (
    select public.build_product_embedding_source(product.id) as document
  ) source
  where product.status = 'active'
    and not exists (
      select 1
      from public.product_embeddings product_embedding
      where product_embedding.product_id = product.id
        and product_embedding.model = 'nvidia/nemotron-3-embed-1b:free'
        and product_embedding.content_hash = md5(source.document)
    )
  order by product.id
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

create or replace function public.store_product_embedding(
  p_product_id uuid,
  p_embedding extensions.vector(2048),
  p_source_document text,
  p_model text default 'nvidia/nemotron-3-embed-1b:free'
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  current_source text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'permission denied';
  end if;
  if p_model is distinct from 'nvidia/nemotron-3-embed-1b:free' then
    raise exception 'unsupported embedding model';
  end if;
  if p_embedding is null then
    raise exception 'embedding is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text, 0));

  select public.build_product_embedding_source(product.id)
  into current_source
  from public.products product
  where product.id = p_product_id
    and product.status = 'active';

  if current_source is null then
    raise exception 'active product not found';
  end if;
  if p_source_document is distinct from current_source then
    raise exception 'stale embedding source';
  end if;

  insert into public.product_embeddings (
    product_id,
    embedding,
    model,
    source_document,
    content_hash,
    embedded_at
  ) values (
    p_product_id,
    p_embedding,
    p_model,
    p_source_document,
    md5(p_source_document),
    now()
  )
  on conflict (product_id) do update set
    embedding = excluded.embedding,
    model = excluded.model,
    source_document = excluded.source_document,
    content_hash = excluded.content_hash,
    embedded_at = excluded.embedded_at;
end;
$$;

create or replace function public.match_product_embeddings(
  p_query_embedding extensions.vector(2048),
  p_max_price numeric default null,
  p_match_count integer default 10
)
returns table (
  product_id uuid,
  similarity double precision
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
set enable_indexscan = off
set enable_indexonlyscan = off
set enable_bitmapscan = off
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'permission denied';
  end if;
  if p_query_embedding is null then
    raise exception 'query embedding is required';
  end if;

  return query
  select
    product_embedding.product_id,
    (1 - (product_embedding.embedding <=> p_query_embedding))::double precision
  from public.product_embeddings product_embedding
  join public.products product on product.id = product_embedding.product_id
  where product_embedding.model = 'nvidia/nemotron-3-embed-1b:free'
    and product.status = 'active'
    and exists (
      select 1
      from public.product_variants variant
      where variant.product_id = product.id
        and variant.stock_quantity > 0
    )
    and (p_max_price is null or product.current_price <= p_max_price)
  order by product_embedding.embedding <=> p_query_embedding, product_embedding.product_id
  limit least(greatest(coalesce(p_match_count, 10), 1), 50);
end;
$$;

revoke all on function public.build_product_embedding_source(uuid) from public;
revoke all on function public.build_product_embedding_source(uuid) from anon;
revoke all on function public.build_product_embedding_source(uuid) from authenticated;
revoke all on function public.delete_product_embedding(uuid) from public;
revoke all on function public.delete_product_embedding(uuid) from anon;
revoke all on function public.delete_product_embedding(uuid) from authenticated;
revoke all on function public.invalidate_product_embedding_from_product() from public;
revoke all on function public.invalidate_product_embedding_from_product() from anon;
revoke all on function public.invalidate_product_embedding_from_product() from authenticated;
revoke all on function public.invalidate_product_embedding_from_category() from public;
revoke all on function public.invalidate_product_embedding_from_category() from anon;
revoke all on function public.invalidate_product_embedding_from_category() from authenticated;
revoke all on function public.invalidate_product_embedding_from_category_link() from public;
revoke all on function public.invalidate_product_embedding_from_category_link() from anon;
revoke all on function public.invalidate_product_embedding_from_category_link() from authenticated;
revoke all on function public.invalidate_product_embedding_from_variant() from public;
revoke all on function public.invalidate_product_embedding_from_variant() from anon;
revoke all on function public.invalidate_product_embedding_from_variant() from authenticated;
revoke all on function public.get_product_embedding_sources(integer) from public;
revoke all on function public.get_product_embedding_sources(integer) from anon;
revoke all on function public.get_product_embedding_sources(integer) from authenticated;
grant execute on function public.get_product_embedding_sources(integer) to service_role;
revoke all on function public.store_product_embedding(uuid, extensions.vector, text, text) from public;
revoke all on function public.store_product_embedding(uuid, extensions.vector, text, text) from anon;
revoke all on function public.store_product_embedding(uuid, extensions.vector, text, text) from authenticated;
grant execute on function public.store_product_embedding(uuid, extensions.vector, text, text) to service_role;
revoke all on function public.match_product_embeddings(extensions.vector, numeric, integer) from public;
revoke all on function public.match_product_embeddings(extensions.vector, numeric, integer) from anon;
revoke all on function public.match_product_embeddings(extensions.vector, numeric, integer) from authenticated;
grant execute on function public.match_product_embeddings(extensions.vector, numeric, integer) to service_role;

notify pgrst, 'reload schema';
