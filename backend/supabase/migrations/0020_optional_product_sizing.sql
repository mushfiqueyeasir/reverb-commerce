-- Optional product sizing with variant-backed inventory for every product.

alter table public.products
  add column if not exists sizing_mode text not null default 'required';

update public.products product
set sizing_mode = case
  when exists (
    select 1
    from public.product_variants variant
    where variant.product_id = product.id
      and nullif(btrim(variant.size), '') is not null
  ) then 'required'
  when exists (
    select 1
    from public.product_variants variant
    where variant.product_id = product.id
  ) then 'none'
  else 'required'
end;

update public.products product
set status = 'draft'
where status = 'active'
  and not exists (
    select 1 from public.product_variants variant where variant.product_id = product.id
  );

alter table public.products
  drop constraint if exists products_sizing_mode_check;
alter table public.products
  add constraint products_sizing_mode_check
  check (sizing_mode in ('none', 'required'));

alter table public.product_variants
  drop constraint if exists product_variants_stock_quantity_check;
alter table public.product_variants
  add constraint product_variants_stock_quantity_check
  check (stock_quantity >= 0);

alter table public.product_variants
  drop constraint if exists product_variants_low_stock_threshold_check;
alter table public.product_variants
  add constraint product_variants_low_stock_threshold_check
  check (low_stock_threshold >= 0);

alter table public.product_variants
  drop constraint if exists product_variants_product_id_size_color_key;
alter table public.product_variants
  drop constraint if exists product_variants_identity_key;
alter table public.product_variants
  add constraint product_variants_identity_key
  unique nulls not distinct (product_id, size, color);

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants (lower(btrim(sku)))
  where nullif(btrim(sku), '') is not null;

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_payment_method text;
  v_variant_id uuid;
  v_variant record;
  v_quantity int;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_discount_percent numeric(5,2);
  v_discount numeric(12,2);
  v_total numeric(12,2);
  v_totals jsonb;
  item jsonb;
begin
  if payload -> 'delivery' is null or payload -> 'items' is null or payload -> 'totals' is null then
    raise exception 'delivery, items and totals are required';
  end if;
  if jsonb_typeof(payload -> 'items') <> 'array'
     or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'order must contain at least one item';
  end if;

  v_payment_method := lower(coalesce(nullif(payload ->> 'payment_method', ''), 'cod'));
  if v_payment_method not in ('cod', 'bkash') then
    raise exception 'invalid payment method';
  end if;

  insert into public.orders (delivery, totals, notes, payment_method, payment_status)
  values (
    payload -> 'delivery',
    '{}'::jsonb,
    nullif(payload ->> 'notes', ''),
    v_payment_method,
    'unpaid'
  )
  returning id, order_number into v_order_id, v_order_number;

  for item in select * from jsonb_array_elements(payload -> 'items') loop
    v_variant_id := nullif(item ->> 'variant_id', '')::uuid;
    v_quantity := coalesce((item ->> 'quantity')::int, 0);

    if v_variant_id is null then
      raise exception 'a product variant is required for every order item';
    end if;
    if v_quantity < 1 then
      raise exception 'item quantity must be at least one';
    end if;

    select
      variant.id,
      variant.product_id,
      variant.size,
      variant.color,
      variant.stock_quantity,
      product.current_price as unit_price,
      product.title,
      product.sizing_mode
    into v_variant
    from public.product_variants variant
    join public.products product on product.id = variant.product_id
    where variant.id = v_variant_id
      and product.status = 'active'
    for update of variant;

    if not found then
      raise exception 'product variant is unavailable';
    end if;
    if nullif(item ->> 'product_id', '') is not null
       and (item ->> 'product_id')::uuid <> v_variant.product_id then
      raise exception 'product variant does not belong to the product';
    end if;
    if v_variant.sizing_mode = 'required'
       and nullif(btrim(v_variant.size), '') is null then
      raise exception 'sized product variant is missing its size';
    end if;
    if v_variant.sizing_mode = 'none'
       and nullif(btrim(v_variant.size), '') is not null then
      raise exception 'size-free product variant cannot have a size';
    end if;
    if v_variant.stock_quantity < v_quantity then
      raise exception 'insufficient stock for %', v_variant.title;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, title, size, color, quantity, unit_price)
    values (
      v_order_id,
      v_variant.product_id,
      v_variant.id,
      v_variant.title,
      v_variant.size,
      v_variant.color,
      v_quantity,
      v_variant.unit_price
    );

    update public.product_variants
    set stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    where id = v_variant.id;

    v_subtotal := v_subtotal + (v_variant.unit_price * v_quantity);
  end loop;

  v_shipping := greatest(0, coalesce((payload -> 'totals' ->> 'shipping')::numeric, 0));
  v_discount_percent := greatest(
    0,
    least(100, coalesce((payload -> 'totals' ->> 'discount_percent')::numeric, 0))
  );
  v_discount := round(v_subtotal * v_discount_percent / 100, 2);
  v_total := greatest(0, v_subtotal - v_discount) + v_shipping;
  v_totals := jsonb_build_object(
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'discount', v_discount,
    'discount_percent', v_discount_percent,
    'promo_code', nullif(payload -> 'totals' ->> 'promo_code', ''),
    'total', v_total
  );

  update public.orders set totals = v_totals where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'totals', v_totals
  );
end;
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.place_order(jsonb) from anon;
revoke all on function public.place_order(jsonb) from authenticated;
grant execute on function public.place_order(jsonb) to service_role;
