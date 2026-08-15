with source as (
  select
    settings.id,
    case
      when jsonb_typeof(settings.socials) = 'object' then settings.socials
      else '{}'::jsonb
    end as socials,
    case
      when jsonb_typeof(settings.socials -> '_cms') = 'object' then settings.socials -> '_cms'
      else '{}'::jsonb
    end as cms,
    case
      when jsonb_typeof(settings.socials #> '{_cms,navbar}') = 'object' then settings.socials #> '{_cms,navbar}'
      else '{}'::jsonb
    end as navbar,
    left(trim(regexp_replace(coalesce(settings.announcement_text, ''), '\s+', ' ', 'g')), 160) as announcement_text,
    settings.announcement_active,
    case
      when length(trim(coalesce(settings.announcement_url, ''))) between 1 and 300
        and trim(settings.announcement_url) !~ E'\\\\'
        and trim(settings.announcement_url) !~ '[[:cntrl:]]'
        and (
          trim(settings.announcement_url) ~ '^/($|[^/])'
          or trim(settings.announcement_url) ~* '^(https://|mailto:|tel:)'
        )
      then trim(settings.announcement_url)
      else null
    end as announcement_url
  from public.site_settings settings
)
update public.site_settings settings
set socials = jsonb_set(
  jsonb_set(source.socials, '{_cms}', source.cms, true),
  '{_cms,navbar}',
  source.navbar || jsonb_build_object(
    'announcement', jsonb_build_object(
      'text', source.announcement_text,
      'active', source.announcement_active is true and source.announcement_text <> '',
      'url', source.announcement_url
    )
  ),
  true
)
from source
where settings.id = source.id
  and not source.navbar ? 'announcement';
