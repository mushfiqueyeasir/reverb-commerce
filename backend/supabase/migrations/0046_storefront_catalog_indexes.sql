create index if not exists product_categories_category_product_idx
  on public.product_categories (category_id, product_id);

create index if not exists products_storefront_featured_idx
  on public.products (status, sort, created_at desc, id);

create index if not exists products_storefront_price_idx
  on public.products (status, current_price, id);
