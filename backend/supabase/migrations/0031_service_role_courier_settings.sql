create or replace function public.save_courier_settings(
  p_settings jsonb,
  p_active_provider text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  item_provider text;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'permission denied';
  end if;
  if p_active_provider is not null
     and p_active_provider not in ('pathao', 'steadfast', 'redx') then
    raise exception 'invalid courier provider';
  end if;

  update public.courier_settings set active = false where active;

  for item in select value from jsonb_array_elements(p_settings)
  loop
    item_provider := item ->> 'provider';
    if item_provider not in ('pathao', 'steadfast', 'redx') then
      raise exception 'invalid courier provider';
    end if;

    insert into public.courier_settings (
      provider, active, sandbox, client_id, client_secret, username, password,
      api_key, secret_key, access_token, pickup_store_id, webhook_secret,
      updated_at
    ) values (
      item_provider,
      coalesce(item_provider = p_active_provider, false),
      coalesce((item ->> 'sandbox')::boolean, false),
      nullif(item ->> 'client_id', ''),
      nullif(item ->> 'client_secret', ''),
      nullif(item ->> 'username', ''),
      nullif(item ->> 'password', ''),
      nullif(item ->> 'api_key', ''),
      nullif(item ->> 'secret_key', ''),
      nullif(item ->> 'access_token', ''),
      nullif(item ->> 'pickup_store_id', ''),
      nullif(item ->> 'webhook_secret', ''),
      now()
    )
    on conflict (provider) do update set
      active = excluded.active,
      sandbox = excluded.sandbox,
      client_id = excluded.client_id,
      client_secret = excluded.client_secret,
      username = excluded.username,
      password = excluded.password,
      api_key = excluded.api_key,
      secret_key = excluded.secret_key,
      access_token = excluded.access_token,
      pickup_store_id = excluded.pickup_store_id,
      webhook_secret = excluded.webhook_secret,
      updated_at = now();
  end loop;
end;
$$;

revoke all on function public.save_courier_settings(jsonb, text) from public;
grant execute on function public.save_courier_settings(jsonb, text) to authenticated;
grant execute on function public.save_courier_settings(jsonb, text) to service_role;

notify pgrst, 'reload schema';
