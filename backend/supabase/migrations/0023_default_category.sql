-- VE-gear :: 0023 protected default category
-- Provides the fixed first storefront category used to link to all products.

alter table public.categories
  add column if not exists is_default boolean not null default false;

-- Normalize existing category positions so zero remains reserved for the default.
with ordered as (
  select
    id,
    row_number() over (order by sort asc, created_at asc, id asc) * 10 as next_sort
  from public.categories
  where not is_default
)
update public.categories c
set sort = ordered.next_sort
from ordered
where c.id = ordered.id;

do $$
declare
  default_id uuid;
begin
  select id into default_id
  from public.categories
  where is_default
  limit 1;

  if default_id is null then
    select id into default_id
    from public.categories
    where slug = 'default'
    limit 1;
  end if;

  if default_id is null then
    insert into public.categories (name, slug, description, sort, is_default)
    values ('Default', 'default', 'Browse all products', 0, true)
    returning id into default_id;
  else
    update public.categories
    set is_default = true, sort = 0
    where id = default_id;
  end if;
end $$;

create unique index if not exists categories_single_default_idx
  on public.categories (is_default)
  where is_default;

alter table public.categories
  drop constraint if exists categories_default_sort_check;
alter table public.categories
  add constraint categories_default_sort_check
  check (
    (is_default and sort = 0)
    or (not is_default and sort > 0)
  );

create or replace function public.protect_default_category()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_default then
      raise exception 'The default category cannot be deleted.';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_default and not new.is_default then
      raise exception 'The default category cannot be unmarked.';
    end if;
    if old.is_default and new.sort <> 0 then
      raise exception 'The default category must remain first.';
    end if;
    if not old.is_default and new.is_default then
      raise exception 'The default category cannot be changed.';
    end if;
  end if;

  if not new.is_default and new.sort <= 0 then
    raise exception 'Category position zero is reserved for the default category.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_default_category on public.categories;
create trigger trg_protect_default_category
  before insert or update or delete on public.categories
  for each row execute function public.protect_default_category();
