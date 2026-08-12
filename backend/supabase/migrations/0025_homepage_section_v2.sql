alter table public.homepage_sections
  drop constraint if exists homepage_sections_type_check;

update public.homepage_sections
set type = 'banner'
where type = 'hero';

alter table public.homepage_sections
  add constraint homepage_sections_type_check
  check (
    type in (
      'banner',
      'categories',
      'featured',
      'reviews',
      'promo',
      'richtext',
      'banner_v2',
      'categories_v2',
      'featured_v2',
      'reviews_v2',
      'promo_v2',
      'richtext_v2'
    )
  );

with section_defaults(id, type, title, subtitle, body, active, position) as (
  values
    ('60000000-0000-4000-8000-000000000001'::uuid, 'banner'::text, null::text, null::text, null::text, true, 1),
    ('60000000-0000-4000-8000-000000000002'::uuid, 'categories'::text, 'Shop by Category'::text, 'Find your fit'::text, null::text, true, 2),
    ('60000000-0000-4000-8000-000000000003'::uuid, 'featured'::text, 'Featured Gear'::text, 'Latest drops'::text, null::text, true, 3),
    ('60000000-0000-4000-8000-000000000005'::uuid, 'reviews'::text, 'From the Community'::text, null::text, null::text, true, 4),
    ('60000000-0000-4000-8000-000000000004'::uuid, 'promo'::text, null::text, null::text, null::text, true, 5),
    ('60000000-0000-4000-8000-000000000006'::uuid, 'richtext'::text, 'Our Story'::text, null::text, null::text, false, 6),
    ('60000000-0000-4000-8000-000000000007'::uuid, 'banner_v2'::text, null::text, null::text, null::text, false, 7),
    ('60000000-0000-4000-8000-000000000008'::uuid, 'categories_v2'::text, 'Shop by Category'::text, 'Find your fit'::text, null::text, false, 8),
    ('60000000-0000-4000-8000-000000000009'::uuid, 'featured_v2'::text, 'Featured Gear'::text, 'Latest drops'::text, null::text, false, 9),
    ('60000000-0000-4000-8000-000000000010'::uuid, 'reviews_v2'::text, 'From the Community'::text, null::text, null::text, false, 10),
    ('60000000-0000-4000-8000-000000000011'::uuid, 'promo_v2'::text, null::text, null::text, null::text, false, 11),
    ('60000000-0000-4000-8000-000000000012'::uuid, 'richtext_v2'::text, 'Our Story'::text, null::text, null::text, false, 12)
), sort_base as (
  select coalesce(max(sort), -1) as max_sort
  from public.homepage_sections
), missing_defaults as (
  select section_defaults.*
  from section_defaults
  where not exists (
    select 1
    from public.homepage_sections existing
    where existing.type = section_defaults.type
  )
), ordered_defaults as (
  select missing_defaults.*,
    row_number() over (order by position) as missing_position
  from missing_defaults
)
insert into public.homepage_sections (
  id, type, title, subtitle, body, sort, active, config
)
select
  ordered_defaults.id,
  ordered_defaults.type,
  ordered_defaults.title,
  ordered_defaults.subtitle,
  ordered_defaults.body,
  sort_base.max_sort + ordered_defaults.missing_position,
  ordered_defaults.active,
  '{}'::jsonb
from ordered_defaults
cross join sort_base
on conflict do nothing;
