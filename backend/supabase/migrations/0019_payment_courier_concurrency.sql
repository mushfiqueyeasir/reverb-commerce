-- Serialize payment finalization and courier shipment state changes.

alter table public.orders
  drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'processing', 'paid', 'failed'));

create or replace function public.delete_unpaid_gateway_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  select id into v_order_id
  from public.orders
  where id = p_order_id
    and payment_method <> 'cod'
    and payment_status in ('unpaid', 'failed')
  for update;

  if v_order_id is null then
    return false;
  end if;
  if exists (
    select 1 from public.order_shipments where order_id = p_order_id
  ) then
    return false;
  end if;

  with quantities as (
    select item.variant_id, sum(item.quantity)::int as quantity
    from public.order_items item
    join public.orders orders on orders.id = item.order_id
    where item.order_id = p_order_id
      and orders.status in ('pending', 'confirmed', 'processing')
      and item.variant_id is not null
    group by item.variant_id
  )
  update public.product_variants variant
  set stock_quantity = greatest(0, variant.stock_quantity + quantities.quantity),
      updated_at = now()
  from quantities
  where variant.id = quantities.variant_id;

  delete from public.orders where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.delete_unpaid_gateway_order(uuid) from public;
grant execute on function public.delete_unpaid_gateway_order(uuid) to service_role;

create or replace function public.cleanup_abandoned_gateway_orders(
  p_cutoff timestamptz default (now() - interval '1 hour')
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate record;
  deleted_numbers text[] := array[]::text[];
begin
  for candidate in
    select id, order_number
    from public.orders
    where payment_method <> 'cod'
      and payment_status = 'unpaid'
      and created_at < p_cutoff
    order by created_at
    for update skip locked
  loop
    if public.delete_unpaid_gateway_order(candidate.id) then
      deleted_numbers := array_append(deleted_numbers, candidate.order_number);
    end if;
  end loop;

  return jsonb_build_object(
    'count', cardinality(deleted_numbers),
    'order_numbers', to_jsonb(deleted_numbers)
  );
end;
$$;

revoke all on function public.cleanup_abandoned_gateway_orders(timestamptz) from public;
grant execute on function public.cleanup_abandoned_gateway_orders(timestamptz) to service_role;

create or replace function public.cancel_order_safely(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_staff() then
    raise exception 'permission denied';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order not found';
  end if;
  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'order cannot be cancelled';
  end if;
  if v_order.payment_status = 'processing' then
    raise exception 'payment is currently processing';
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

create or replace function public.reserve_courier_shipment(
  p_order_id uuid,
  p_provider text,
  p_delivery_area_id text,
  p_delivery_area_name text,
  p_parcel_weight numeric,
  p_request_payload jsonb,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_shipment_id uuid;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if v_order.id is null then
    raise exception 'order not found';
  end if;
  if v_order.status not in ('confirmed', 'processing') then
    raise exception 'confirm the order before sending it to a courier';
  end if;
  if v_order.payment_method = 'bkash' and v_order.payment_status <> 'paid' then
    raise exception 'only paid bKash orders can be sent to a courier';
  end if;

  insert into public.order_shipments (
    order_id,
    provider,
    sync_state,
    delivery_area_id,
    delivery_area_name,
    parcel_weight,
    request_payload,
    created_by
  ) values (
    p_order_id,
    p_provider,
    'creating',
    p_delivery_area_id,
    p_delivery_area_name,
    p_parcel_weight,
    coalesce(p_request_payload, '{}'::jsonb),
    p_created_by
  )
  returning id into v_shipment_id;

  return v_shipment_id;
end;
$$;

revoke all on function public.reserve_courier_shipment(uuid, text, text, text, numeric, jsonb, uuid) from public;
grant execute on function public.reserve_courier_shipment(uuid, text, text, text, numeric, jsonb, uuid) to service_role;

create or replace function public.apply_courier_event(
  p_shipment_id uuid,
  p_provider text,
  p_event_key text,
  p_event_name text,
  p_courier_status text,
  p_message text,
  p_provider_time timestamptz,
  p_payload jsonb,
  p_next_order_status public.order_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment public.order_shipments%rowtype;
  v_event_id uuid;
  v_event_time timestamptz := coalesce(p_provider_time, now());
begin
  select * into v_shipment
  from public.order_shipments
  where id = p_shipment_id
  for update;

  if v_shipment.id is null or v_shipment.provider <> p_provider then
    raise exception 'shipment not found';
  end if;

  insert into public.courier_events (
    shipment_id,
    provider,
    event_key,
    event_name,
    courier_status,
    message,
    provider_time,
    payload
  ) values (
    p_shipment_id,
    p_provider,
    p_event_key,
    p_event_name,
    p_courier_status,
    p_message,
    p_provider_time,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provider, event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('duplicate', true);
  end if;

  if (p_event_name <> 'shipment.created' or v_shipment.last_event_at is null)
     and (
       v_shipment.last_event_at is null
       or v_event_time > v_shipment.last_event_at
       or (
         v_event_time = v_shipment.last_event_at
         and p_next_order_status is not null
         and exists (
           select 1
           from public.orders
           where id = v_shipment.order_id
             and case status
               when 'pending' then 0
               when 'confirmed' then 1
               when 'processing' then 2
               when 'shipped' then 3
               when 'delivered' then 4
               else 99
             end < case p_next_order_status
               when 'processing' then 2
               when 'shipped' then 3
               when 'delivered' then 4
               else -1
             end
         )
       )
     ) then
    update public.order_shipments
    set sync_state = 'synced',
        courier_status = p_courier_status,
        status_message = p_message,
        last_event_at = v_event_time,
        synced_at = coalesce(synced_at, now())
    where id = p_shipment_id;
  end if;

  if p_next_order_status in ('processing', 'shipped', 'delivered') then
    update public.orders
    set status = p_next_order_status,
        updated_at = now()
    where id = v_shipment.order_id
      and status <> 'cancelled'
      and case status
        when 'pending' then 0
        when 'confirmed' then 1
        when 'processing' then 2
        when 'shipped' then 3
        when 'delivered' then 4
        else 99
      end < case p_next_order_status
        when 'processing' then 2
        when 'shipped' then 3
        when 'delivered' then 4
        else -1
      end;
  end if;

  return jsonb_build_object('duplicate', false);
end;
$$;

revoke all on function public.apply_courier_event(uuid, text, text, text, text, text, timestamptz, jsonb, public.order_status) from public;
grant execute on function public.apply_courier_event(uuid, text, text, text, text, text, timestamptz, jsonb, public.order_status) to service_role;
