-- Remove incomplete gateway orders and return reserved stock.

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
    and payment_status <> 'paid'
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

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'cleanup-abandoned-gateway-orders'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'cleanup-abandoned-gateway-orders',
    '*/15 * * * *',
    $job$select public.cleanup_abandoned_gateway_orders(now() - interval '1 hour');$job$
  );
end;
$$;
