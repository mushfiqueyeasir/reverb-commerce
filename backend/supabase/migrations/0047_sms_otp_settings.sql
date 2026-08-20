-- Khudebarta SMS gateway configuration and checkout OTP verification.

-- Private SMS gateway settings (admin-only; not on public site_settings).
create table if not exists public.sms_settings (
  id           int primary key default 1 check (id = 1),
  enabled      boolean not null default false,
  sender_id    text,
  api_key      text,
  secret_key   text,
  checkout_otp boolean not null default false,
  updated_at   timestamptz not null default now()
);

insert into public.sms_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.sms_settings enable row level security;

drop policy if exists sms_settings_admin_all on public.sms_settings;
create policy sms_settings_admin_all on public.sms_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists trg_touch_sms_settings on public.sms_settings;
create trigger trg_touch_sms_settings
  before update on public.sms_settings
  for each row execute function public.touch_updated_at();

-- One-time passwords for checkout verification. Service-role only — no anon
-- policies, so the admin service client is the only path to these rows.
create table if not exists public.sms_otps (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code_hash   text not null,
  salt        text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists sms_otps_phone_created_idx
  on public.sms_otps (phone, created_at desc);

alter table public.sms_otps enable row level security;
