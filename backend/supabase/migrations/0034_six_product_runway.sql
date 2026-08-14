update public.homepage_sections
set config = jsonb_set(coalesce(config, '{}'::jsonb), '{limit}', '6'::jsonb, true)
where type = 'featured_v2'
  and config -> 'limit' = '5'::jsonb;
