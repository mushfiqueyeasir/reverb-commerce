alter table public.ai_search_settings
  add column if not exists aihubmix_api_key text;

alter table public.ai_search_settings
  drop constraint if exists ai_search_settings_provider_check;

alter table public.ai_search_settings
  add constraint ai_search_settings_provider_check
  check (provider in ('gemini', 'openrouter', 'groq', 'aihubmix'));

notify pgrst, 'reload schema';
