update public.homepage_sections
set config = jsonb_set(coalesce(config, '{}'::jsonb), '{limit}', '5'::jsonb, true)
where type in ('featured', 'deals', 'new_arrivals')
  and config -> 'limit' = '4'::jsonb;
