alter table public.homepage_sections
  drop constraint if exists homepage_sections_type_check;

alter table public.homepage_sections
  add constraint homepage_sections_type_check
  check (
    type in (
      'banner',
      'categories',
      'deals',
      'new_arrivals',
      'featured',
      'reviews',
      'promo',
      'richtext',
      'banner_v2',
      'categories_v2',
      'featured_v2',
      'reviews_v2',
      'promo_v2',
      'richtext_v2',
      'guarantees',
      'studio_notes',
      'ai_search'
    )
  );

with section_defaults(id, type, title, subtitle, config, position) as (
  values
    (
      '60000000-0000-4000-8000-000000000017'::uuid,
      'ai_search'::text,
      'Find your next favourite, faster.'::text,
      'Describe the kind of piece you are looking for and the AI shopping advisor will suggest the right match from the active collection.'::text,
      '{"eyebrow":"New · AI shopping advisor","pill_label":"New","cta_label":"Ask the AI advisor","image_path":null,"image_alt":"AI shopping advisor"}'::jsonb,
      1
    )
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
  null,
  sort_base.max_sort + ordered_defaults.missing_position,
  false,
  ordered_defaults.config
from ordered_defaults
cross join sort_base
on conflict do nothing;