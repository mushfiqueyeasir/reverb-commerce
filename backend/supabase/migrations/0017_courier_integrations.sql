-- Courier provider configuration, shipments, and webhook history.

create table if not exists public.courier_settings (
  provider         text primary key check (provider in ('pathao', 'steadfast', 'redx')),
  active           boolean not null default false,
  sandbox          boolean not null default false,
  client_id        text,
  client_secret    text,
  username         text,
  password         text,
  api_key          text,
  secret_key       text,
  access_token     text,
  pickup_store_id  text,
  webhook_secret   text,
  updated_at       timestamptz not null default now()
);

insert into public.courier_settings (provider, sandbox)
values
  ('pathao', true),
  ('steadfast', false),
  ('redx', true)
on conflict (provider) do nothing;

create unique index if not exists courier_settings_one_active_idx
  on public.courier_settings ((active))
  where active;

create table if not exists public.order_shipments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null unique references public.orders (id) on delete restrict,
  provider            text not null check (provider in ('pathao', 'steadfast', 'redx')),
  sync_state          text not null default 'creating'
                        check (sync_state in ('creating', 'synced', 'failed', 'unknown')),
  external_id         text,
  tracking_code       text,
  courier_status      text,
  status_message      text,
  delivery_area_id    text,
  delivery_area_name  text,
  parcel_weight       numeric(8,3),
  request_payload     jsonb,
  response_payload    jsonb,
  last_event_at       timestamptz,
  synced_at           timestamptz,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists order_shipments_external_id_idx
  on public.order_shipments (provider, external_id)
  where external_id is not null;
create unique index if not exists order_shipments_tracking_code_idx
  on public.order_shipments (provider, tracking_code)
  where tracking_code is not null;
create index if not exists order_shipments_provider_status_idx
  on public.order_shipments (provider, courier_status);

create table if not exists public.courier_events (
  id                uuid primary key default gen_random_uuid(),
  shipment_id       uuid not null references public.order_shipments (id) on delete cascade,
  provider          text not null check (provider in ('pathao', 'steadfast', 'redx')),
  event_key         text not null,
  event_name        text not null,
  courier_status    text,
  message           text,
  provider_time     timestamptz,
  payload           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  unique (provider, event_key)
);

create index if not exists courier_events_shipment_created_idx
  on public.courier_events (shipment_id, created_at desc);

drop trigger if exists trg_touch_courier_settings on public.courier_settings;
create trigger trg_touch_courier_settings
  before update on public.courier_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_order_shipments on public.order_shipments;
create trigger trg_touch_order_shipments
  before update on public.order_shipments
  for each row execute function public.touch_updated_at();

alter table public.courier_settings enable row level security;
alter table public.order_shipments enable row level security;
alter table public.courier_events enable row level security;

drop policy if exists courier_settings_admin_all on public.courier_settings;
create policy courier_settings_admin_all on public.courier_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_shipments_staff_read on public.order_shipments;
create policy order_shipments_staff_read on public.order_shipments
  for select using (public.is_staff());
drop policy if exists order_shipments_staff_insert on public.order_shipments;
create policy order_shipments_staff_insert on public.order_shipments
  for insert with check (public.is_staff());
drop policy if exists order_shipments_staff_update on public.order_shipments;
create policy order_shipments_staff_update on public.order_shipments
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists courier_events_staff_read on public.courier_events;
create policy courier_events_staff_read on public.courier_events
  for select using (public.is_staff());

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
  if not public.is_admin() then
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
      item_provider = p_active_provider,
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

-- Lock-check, restock, and delete in one transaction. The shipment foreign key
-- remains the final guard if a courier sync races with this function.
create or replace function public.delete_orders_safely(p_order_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orders jsonb;
begin
  if not public.is_staff() then
    raise exception 'permission denied';
  end if;

  perform 1
  from public.orders
  where id = any(p_order_ids)
  for update;

  if exists (
    select 1
    from public.order_shipments
    where order_id = any(p_order_ids)
  ) then
    raise exception 'courier-synced orders cannot be deleted';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'order_number', order_number,
        'status', status
      )
      order by created_at
    ),
    '[]'::jsonb
  )
  into v_orders
  from public.orders
  where id = any(p_order_ids);

  with quantities as (
    select oi.variant_id, sum(oi.quantity)::int as quantity
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.id = any(p_order_ids)
      and o.status in ('pending', 'confirmed', 'processing')
      and oi.variant_id is not null
    group by oi.variant_id
  )
  update public.product_variants variant
  set stock_quantity = greatest(0, variant.stock_quantity + quantities.quantity),
      updated_at = now()
  from quantities
  where variant.id = quantities.variant_id;

  delete from public.orders where id = any(p_order_ids);
  return v_orders;
end;
$$;

revoke all on function public.delete_orders_safely(uuid[]) from public;
grant execute on function public.delete_orders_safely(uuid[]) to authenticated;

create or replace function public.delete_customers_safely(p_customer_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customers jsonb;
  v_order_ids uuid[];
begin
  if not public.is_staff() then
    raise exception 'permission denied';
  end if;

  perform 1
  from public.customers
  where id = any(p_customer_ids)
  for update;

  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'name', name, 'phone', phone)),
    '[]'::jsonb
  )
  into v_customers
  from public.customers
  where id = any(p_customer_ids);

  select coalesce(array_agg(id), array[]::uuid[])
  into v_order_ids
  from public.orders
  where customer_id = any(p_customer_ids);

  if cardinality(v_order_ids) > 0 then
    perform public.delete_orders_safely(v_order_ids);
  end if;

  delete from public.customers where id = any(p_customer_ids);
  return v_customers;
end;
$$;

revoke all on function public.delete_customers_safely(uuid[]) from public;
grant execute on function public.delete_customers_safely(uuid[]) to authenticated;

create or replace function public.cancel_order_safely(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
begin
  if not public.is_staff() then
    raise exception 'permission denied';
  end if;

  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if v_status is null then
    raise exception 'order not found';
  end if;
  if v_status in ('delivered', 'cancelled') then
    raise exception 'order cannot be cancelled';
  end if;
  if exists (
    select 1 from public.order_shipments where order_id = p_order_id
  ) then
    raise exception 'courier-synced orders cannot be cancelled';
  end if;

  with quantities as (
    select variant_id, sum(quantity)::int as quantity
    from public.order_items
    where order_id = p_order_id and variant_id is not null
    group by variant_id
  )
  update public.product_variants variant
  set stock_quantity = greatest(0, variant.stock_quantity + quantities.quantity),
      updated_at = now()
  from quantities
  where variant.id = quantities.variant_id;

  update public.orders
  set status = 'cancelled', updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.cancel_order_safely(uuid) from public;
grant execute on function public.cancel_order_safely(uuid) to authenticated;
