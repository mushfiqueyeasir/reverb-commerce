alter table public.categories
  add column if not exists parent_id uuid;

alter table public.categories
  drop constraint if exists categories_parent_id_fkey;
alter table public.categories
  add constraint categories_parent_id_fkey
  foreign key (parent_id)
  references public.categories (id)
  on delete restrict;

alter table public.categories
  drop constraint if exists categories_not_own_parent_check;
alter table public.categories
  add constraint categories_not_own_parent_check
  check (parent_id is null or parent_id <> id);

create index if not exists categories_parent_sort_idx
  on public.categories (parent_id, sort, created_at, id);

create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_is_default boolean;
  creates_cycle boolean;
begin
  perform pg_advisory_xact_lock(hashtext('category-hierarchy'));

  if new.is_default and new.parent_id is not null then
    raise exception 'The default category must remain at the root.';
  end if;

  if new.parent_id is null then
    return new;
  end if;

  select is_default into parent_is_default
  from public.categories
  where id = new.parent_id;

  if not found then
    raise exception 'Parent category was not found.';
  end if;

  if parent_is_default then
    raise exception 'The default category cannot contain subcategories.';
  end if;

  with recursive ancestors as (
    select id, parent_id
    from public.categories
    where id = new.parent_id

    union all

    select category.id, category.parent_id
    from public.categories category
    join ancestors ancestor on category.id = ancestor.parent_id
  )
  select exists(select 1 from ancestors where id = new.id)
  into creates_cycle;

  if creates_cycle then
    raise exception 'Category hierarchy cannot contain a cycle.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_category_hierarchy on public.categories;
create trigger trg_validate_category_hierarchy
  before insert or update of parent_id, is_default on public.categories
  for each row execute function public.validate_category_hierarchy();
