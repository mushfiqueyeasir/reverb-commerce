alter table public.banners
  add column if not exists section_type text;

update public.banners
set section_type = 'banner'
where section_type is null
   or section_type not in ('banner', 'banner_v2');

alter table public.banners
  alter column section_type set default 'banner',
  alter column section_type set not null;

alter table public.banners
  drop constraint if exists banners_section_type_check;

alter table public.banners
  add constraint banners_section_type_check
  check (section_type in ('banner', 'banner_v2'));

create index if not exists banners_section_type_active_sort_idx
  on public.banners (section_type, active, sort);
