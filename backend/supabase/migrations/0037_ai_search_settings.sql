create table if not exists public.ai_search_settings (
  id                 int primary key default 1 check (id = 1),
  enabled            boolean not null default false,
  provider           text not null default 'gemini' check (provider in ('gemini', 'openrouter')),
  gemini_api_key     text,
  openrouter_api_key text,
  updated_at         timestamptz not null default now()
);

insert into public.ai_search_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.ai_search_settings enable row level security;

drop policy if exists ai_search_settings_admin_all on public.ai_search_settings;
create policy ai_search_settings_admin_all on public.ai_search_settings
  for all using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
