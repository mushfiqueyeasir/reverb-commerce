-- New-store content/catalog template. Apply after all numbered migrations.
-- The provisioner replaces the uppercase template markers with escaped SQL
-- literals before submitting this file to the Supabase Management API.
-- To intentionally rerun the template, first remove only this seed's state:
--   delete from provisioning.seed_state where seed_key = 'store-template';
-- Resetting that state also reapplies the store-specific singleton settings;
-- do not reset it on a merchant-managed store without reviewing this file.

begin;

select pg_advisory_xact_lock(hashtextextended('reverb-commerce:store-template', 0));

-- Kept outside public so the marker is not exposed through the default API.
create schema if not exists provisioning;
create table if not exists provisioning.seed_state (
  seed_key    text primary key,
  version     int not null,
  completed_at timestamptz not null default now()
);

create temporary table store_template_context (
  store_name             text not null,
  contact_email          text,
  contact_phone          text,
  store_address          text,
  currency               text not null,
  currency_symbol        text not null,
  shipping_flat          numeric(12,2) not null,
  free_shipping_threshold numeric(12,2),
  should_seed            boolean not null
) on commit drop;

insert into store_template_context
select
  __STORE_NAME__,
  nullif(__CONTACT_EMAIL__, ''),
  nullif(__CONTACT_PHONE__, ''),
  nullif(__STORE_ADDRESS__, ''),
  __CURRENCY__,
  __CURRENCY_SYMBOL__,
  (__SHIPPING_FLAT__)::numeric(12,2),
  nullif(__FREE_SHIPPING_THRESHOLD__, '')::numeric(12,2),
  not exists (
    select 1
    from provisioning.seed_state
    where seed_key = 'store-template'
  );

-- Storage object paths are bucket-relative. The provisioner generates and
-- uploads these PNG objects before making the storefront public.
--
-- branding:         store-template/v1/logo.png
-- branding:         store-template/v1/invoice-logo.png
-- branding:         store-template/v1/favicon.png
-- branding:         store-template/v1/og-image.png
-- banner-images:    store-template/v1/home/hero-desktop.png
-- banner-images:    store-template/v1/home/hero-mobile.png
-- category-images:  store-template/v1/categories/apparel.png
-- category-images:  store-template/v1/categories/accessories.png
-- product-images:   store-template/v1/products/essential-tee-01.png
-- product-images:   store-template/v1/products/essential-tee-02.png
-- product-images:   store-template/v1/products/daypack-01.png
-- product-images:   store-template/v1/products/daypack-02.png
-- promotion-images: store-template/v1/promotions/welcome-offer.png
-- review-images:    store-template/v1/reviews/sample-review.png

insert into public.site_settings (
  id, store_name, logo_path, invoice_logo_path, favicon_path,
  contact_email, contact_phone, address, currency, currency_symbol,
  shipping_flat, free_shipping_threshold, socials,
  announcement_text, announcement_active, announcement_url
)
select
  1,
  context.store_name,
  'store-template/v1/logo.png',
  'store-template/v1/invoice-logo.png',
  'store-template/v1/favicon.png',
  context.contact_email,
  context.contact_phone,
  context.store_address,
  context.currency,
  context.currency_symbol,
  context.shipping_flat,
  context.free_shipping_threshold,
  '{}'::jsonb,
  'Welcome to our new store',
  true,
  '/product'
from store_template_context context
where context.should_seed
on conflict (id) do nothing;

-- Initialize store-specific settings once. Existing social keys and an existing
-- _cms document are preserved, including data written before this seed runs.
with seed as (
  select
    context.*,
    jsonb_build_object(
      'banners', jsonb_build_array(
        jsonb_build_object(
          'id', '50000000-0000-4000-8000-000000000001',
          'section_type', 'banner',
          'title', 'A fresh collection is ready',
          'subtitle', 'Replace this sample copy and imagery before launch.',
          'image_path', 'store-template/v1/home/hero-desktop.png',
          'mobile_image_path', 'store-template/v1/home/hero-mobile.png',
          'cta_label', 'Shop sample products',
          'cta_url', '/product',
          'sort', 10,
          'active', true
        )
      ),
      'homepage_sections', jsonb_build_array(
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000001', 'type', 'banner', 'title', null, 'subtitle', null, 'body', null, 'sort', 10, 'active', true, 'config', '{}'::jsonb),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000002', 'type', 'categories', 'title', 'Shop by category', 'subtitle', 'Start with these sample collections', 'body', null, 'sort', 20, 'active', true, 'config', jsonb_build_object('cta_label', 'View all products', 'cta_url', '/product')),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000003', 'type', 'featured', 'title', 'Featured products', 'subtitle', 'Sample products ready to customize', 'body', null, 'sort', 30, 'active', true, 'config', jsonb_build_object('limit', 5, 'cta_label', 'View all products', 'cta_url', '/product')),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000004', 'type', 'promo', 'title', 'New-store offer', 'subtitle', 'Replace this placeholder promotion before launch', 'body', null, 'sort', 40, 'active', true, 'config', jsonb_build_object('promotion_id', '70000000-0000-4000-8000-000000000001')),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000005', 'type', 'reviews', 'title', 'Sample review', 'subtitle', 'Replace with verified customer feedback', 'body', null, 'sort', 50, 'active', true, 'config', jsonb_build_object('limit', 12)),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000006', 'type', 'richtext', 'title', 'Built for everyday use', 'subtitle', null, 'body', '<p>This is placeholder homepage content. Tell customers what makes the store distinctive.</p>', 'sort', 60, 'active', true, 'config', jsonb_build_object('layout', 'simple', 'image_bucket', 'branding', 'cards', '[]'::jsonb)),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000007', 'type', 'banner_v2', 'title', null, 'subtitle', null, 'body', null, 'sort', 70, 'active', false, 'config', '{}'::jsonb),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000008', 'type', 'categories_v2', 'title', 'Shop by category', 'subtitle', 'Start with these sample collections', 'body', null, 'sort', 80, 'active', false, 'config', '{}'::jsonb),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000009', 'type', 'featured_v2', 'title', 'Featured products', 'subtitle', 'Sample products ready to customize', 'body', null, 'sort', 90, 'active', false, 'config', jsonb_build_object('limit', 6, 'cta_label', 'View all products', 'cta_url', '/product')),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000010', 'type', 'reviews_v2', 'title', 'Sample review', 'subtitle', 'Replace with verified customer feedback', 'body', null, 'sort', 100, 'active', false, 'config', '{}'::jsonb),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000011', 'type', 'promo_v2', 'title', 'New-store offer', 'subtitle', 'Replace this placeholder promotion before launch', 'body', null, 'sort', 110, 'active', false, 'config', '{}'::jsonb),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000012', 'type', 'richtext_v2', 'title', 'Built for everyday use', 'subtitle', null, 'body', '<p>This is placeholder homepage content. Tell customers what makes the store distinctive.</p>', 'sort', 120, 'active', false, 'config', jsonb_build_object('layout', 'feature', 'image_bucket', 'branding', 'cards', '[]'::jsonb)),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000013', 'type', 'deals', 'title', 'Today''s Best Deals', 'subtitle', 'Save on selected products', 'body', null, 'sort', 130, 'active', false, 'config', jsonb_build_object('limit', 5, 'cta_label', 'View all products', 'cta_url', '/product')),
        jsonb_build_object('id', '60000000-0000-4000-8000-000000000014', 'type', 'new_arrivals', 'title', 'New Arrival Products', 'subtitle', 'Discover the latest additions', 'body', null, 'sort', 140, 'active', false, 'config', jsonb_build_object('limit', 5, 'cta_label', 'View all products', 'cta_url', '/product'))
      ),
      'about_sections', jsonb_build_array(
        jsonb_build_object('id', 'about-hero', 'type', 'hero', 'title', 'Hero', 'sort', 0, 'active', true, 'config', jsonb_build_object('image_path', 'store-template/v1/home/hero-desktop.png', 'image_bucket', 'banner')),
        jsonb_build_object('id', 'about-stats', 'type', 'stats', 'title', 'Stats bar', 'sort', 1, 'active', true, 'config', '{}'::jsonb),
        jsonb_build_object('id', 'about-story', 'type', 'story', 'title', 'Story', 'sort', 2, 'active', true, 'config', jsonb_build_object('image_path', 'store-template/v1/home/hero-mobile.png', 'image_bucket', 'banner')),
        jsonb_build_object('id', 'about-values', 'type', 'values', 'title', 'Values', 'sort', 3, 'active', true, 'config', '{}'::jsonb),
        jsonb_build_object('id', 'about-craft', 'type', 'craft', 'title', 'Product standards', 'sort', 4, 'active', true, 'config', jsonb_build_object('image_path', 'store-template/v1/og-image.png', 'image_bucket', 'branding')),
        jsonb_build_object('id', 'about-cta', 'type', 'cta', 'title', 'Community CTA', 'sort', 5, 'active', true, 'config', '{}'::jsonb),
        jsonb_build_object('id', 'about-hero-v2', 'type', 'hero_v2', 'title', 'Hero V2', 'sort', 6, 'active', false, 'config', jsonb_build_object('image_path', 'store-template/v1/home/hero-desktop.png', 'image_bucket', 'banner')),
        jsonb_build_object('id', 'about-stats-v2', 'type', 'stats_v2', 'title', 'Stats bar V2', 'sort', 7, 'active', false, 'config', '{}'::jsonb),
        jsonb_build_object('id', 'about-story-v2', 'type', 'story_v2', 'title', 'Story V2', 'sort', 8, 'active', false, 'config', jsonb_build_object('image_path', 'store-template/v1/home/hero-mobile.png', 'image_bucket', 'banner')),
        jsonb_build_object('id', 'about-values-v2', 'type', 'values_v2', 'title', 'Values V2', 'sort', 9, 'active', false, 'config', '{}'::jsonb),
        jsonb_build_object('id', 'about-craft-v2', 'type', 'craft_v2', 'title', 'Product standards V2', 'sort', 10, 'active', false, 'config', jsonb_build_object('image_path', 'store-template/v1/og-image.png', 'image_bucket', 'branding')),
        jsonb_build_object('id', 'about-cta-v2', 'type', 'cta_v2', 'title', 'Community CTA V2', 'sort', 11, 'active', false, 'config', '{}'::jsonb)
      ),
      'pages', jsonb_build_object(
        'about', jsonb_build_object('slug', 'about', 'title', 'About ' || context.store_name, 'body_html', '<p>This is placeholder copy. Add the merchant story, values, and contact details before launch.</p>', 'updated_at', '1970-01-01T00:00:00Z'),
        'terms', jsonb_build_object('slug', 'terms', 'title', 'Terms of Service', 'body_html', '<p>Placeholder terms only. Replace with terms reviewed for the merchant and selling regions before launch.</p>', 'updated_at', '1970-01-01T00:00:00Z'),
        'privacy', jsonb_build_object('slug', 'privacy', 'title', 'Privacy Policy', 'body_html', '<p>Placeholder privacy notice only. Describe actual data handling practices before launch.</p>', 'updated_at', '1970-01-01T00:00:00Z'),
        'refund', jsonb_build_object('slug', 'refund', 'title', 'Shipping &amp; Returns', 'body_html', '<p>Placeholder shipping and returns policy. Add the merchant''s actual timeframes, costs, and eligibility rules before launch.</p>', 'updated_at', '1970-01-01T00:00:00Z')
      ),
      'announcement', jsonb_build_object('text', 'Welcome to our new store', 'active', true, 'url', '/product'),
      'seo', jsonb_build_object(
        'title', context.store_name || ' | Shop Online',
        'description', 'Browse sample products and replace this search description before launch.',
        'keywords', context.store_name || ', online store, sample products',
        'og_image_path', 'store-template/v1/og-image.png'
      ),
      'pages_seo', jsonb_build_object(
        'home', jsonb_build_object('title', context.store_name || ' | Shop Online', 'description', 'Browse sample products and replace this search description before launch.', 'keywords', context.store_name || ', online store, sample products', 'og_image_path', 'store-template/v1/og-image.png'),
        'about', jsonb_build_object('title', 'About | ' || context.store_name, 'description', 'Learn about ' || context.store_name || '.', 'keywords', context.store_name || ', about', 'og_image_path', 'store-template/v1/og-image.png'),
        'product', jsonb_build_object('title', 'Shop | ' || context.store_name, 'description', 'Browse products from ' || context.store_name || '.', 'keywords', context.store_name || ', products, shop', 'og_image_path', 'store-template/v1/og-image.png'),
        'contact', jsonb_build_object('title', 'Contact | ' || context.store_name, 'description', 'Contact ' || context.store_name || '.', 'keywords', context.store_name || ', contact', 'og_image_path', 'store-template/v1/og-image.png'),
        'reviews', jsonb_build_object('title', 'Reviews | ' || context.store_name, 'description', 'Read customer reviews for ' || context.store_name || '.', 'keywords', context.store_name || ', reviews', 'og_image_path', 'store-template/v1/og-image.png'),
        'cart', jsonb_build_object('title', 'Cart | ' || context.store_name, 'description', 'Review products in your shopping cart.', 'keywords', context.store_name || ', cart', 'og_image_path', 'store-template/v1/og-image.png'),
        'wishlist', jsonb_build_object('title', 'Favorites | ' || context.store_name, 'description', 'Review your saved products.', 'keywords', context.store_name || ', favorites', 'og_image_path', 'store-template/v1/og-image.png'),
        'checkout', jsonb_build_object('title', 'Checkout | ' || context.store_name, 'description', 'Complete your order securely.', 'keywords', context.store_name || ', checkout', 'og_image_path', 'store-template/v1/og-image.png'),
        'track', jsonb_build_object('title', 'Track Order | ' || context.store_name, 'description', 'Track an order from ' || context.store_name || '.', 'keywords', context.store_name || ', track order', 'og_image_path', 'store-template/v1/og-image.png'),
        'privacy', jsonb_build_object('title', 'Privacy Policy | ' || context.store_name, 'description', 'Read the store privacy policy.', 'keywords', context.store_name || ', privacy', 'og_image_path', 'store-template/v1/og-image.png'),
        'terms', jsonb_build_object('title', 'Terms | ' || context.store_name, 'description', 'Read the store terms of service.', 'keywords', context.store_name || ', terms', 'og_image_path', 'store-template/v1/og-image.png'),
        'refund', jsonb_build_object('title', 'Shipping & Returns | ' || context.store_name, 'description', 'Read the store shipping and returns policy.', 'keywords', context.store_name || ', shipping, returns', 'og_image_path', 'store-template/v1/og-image.png')
      )
    ) as cms
  from store_template_context context
  where context.should_seed
)
update public.site_settings settings
set
  store_name = seed.store_name,
  logo_path = 'store-template/v1/logo.png',
  invoice_logo_path = 'store-template/v1/invoice-logo.png',
  favicon_path = 'store-template/v1/favicon.png',
  contact_email = seed.contact_email,
  contact_phone = seed.contact_phone,
  address = seed.store_address,
  currency = seed.currency,
  currency_symbol = seed.currency_symbol,
  shipping_flat = seed.shipping_flat,
  free_shipping_threshold = seed.free_shipping_threshold,
  announcement_text = 'Welcome to our new store',
  announcement_active = true,
  announcement_url = '/product',
  socials = coalesce(settings.socials, '{}'::jsonb) ||
    case
      when coalesce(settings.socials, '{}'::jsonb) ? '_cms' then '{}'::jsonb
      else jsonb_build_object('_cms', seed.cms)
    end
from seed
where settings.id = 1;

-- Replace only the exact page placeholders installed by migration 0007. Any
-- merchant edit, however small, makes the row ineligible for replacement.
with desired(slug, title, body_html, legacy_title, legacy_body) as (
  values
    ('about', 'About ' || __STORE_NAME__, '<p>This is placeholder copy. Add the merchant story, values, and contact details before launch.</p>', 'About VE Gear', '<p>VE Gear was built for riders who want premium streetwear that performs.</p>'),
    ('terms', 'Terms of Service', '<p>Placeholder terms only. Replace with terms reviewed for the merchant and selling regions before launch.</p>', 'Terms of Service', '<p>By using VE Gear you agree to these terms.</p>'),
    ('privacy', 'Privacy Policy', '<p>Placeholder privacy notice only. Describe actual data handling practices before launch.</p>', 'Privacy Policy', '<p>We respect your privacy and protect your data.</p>'),
    ('refund', 'Shipping &amp; Returns', '<p>Placeholder shipping and returns policy. Add the merchant''s actual timeframes, costs, and eligibility rules before launch.</p>', 'Shipping &amp; Return Policy', '<p>Orders ship via Pathao. Returns accepted within 7 days for unused items.</p>')
)
update public.content_pages page
set title = desired.title, body_html = desired.body_html
from desired, store_template_context context
where context.should_seed
  and page.slug = desired.slug
  and page.title = desired.legacy_title
  and page.body_html = desired.legacy_body;

insert into public.content_pages (slug, title, body_html)
select desired.slug, desired.title, desired.body_html
from (values
  ('about', 'About ' || __STORE_NAME__, '<p>This is placeholder copy. Add the merchant story, values, and contact details before launch.</p>'),
  ('terms', 'Terms of Service', '<p>Placeholder terms only. Replace with terms reviewed for the merchant and selling regions before launch.</p>'),
  ('privacy', 'Privacy Policy', '<p>Placeholder privacy notice only. Describe actual data handling practices before launch.</p>'),
  ('refund', 'Shipping &amp; Returns', '<p>Placeholder shipping and returns policy. Add the merchant''s actual timeframes, costs, and eligibility rules before launch.</p>')
) as desired(slug, title, body_html)
cross join store_template_context context
where context.should_seed
on conflict (slug) do nothing;

insert into public.categories (id, name, slug, description, image_path, sort)
select category.id, category.name, category.slug, category.description,
       category.image_path, category.sort
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'Sample Apparel', 'sample-apparel', 'Placeholder apparel collection', 'store-template/v1/categories/apparel.png', 110),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'Sample Accessories', 'sample-accessories', 'Placeholder accessories collection', 'store-template/v1/categories/accessories.png', 120)
) as category(id, name, slug, description, image_path, sort)
cross join store_template_context context
where context.should_seed
on conflict do nothing;

insert into public.products (
  id, title, slug, original_price, current_price, description, status,
  product_type, sort, size_chart, sizing_mode
)
select product.id, product.title, product.slug, product.original_price,
       product.current_price, product.description, product.status,
       product.product_type, product.sort, product.size_chart,
       product.sizing_mode
from (values
  (
    '20000000-0000-4000-8000-000000000001'::uuid,
    'Sample Essential Tee',
    'sample-essential-tee',
    32.00::numeric,
    28.00::numeric,
    '{"html":"<p>Sample product copy for a lightweight everyday tee. Replace materials, fit, and care details before launch.</p>"}'::jsonb,
    'active',
    'tee',
    110,
    '[{"size":"S","chest":"20","length":"27"},{"size":"M","chest":"21","length":"28"},{"size":"L","chest":"22","length":"29"}]'::jsonb,
    'required'
  ),
  (
    '20000000-0000-4000-8000-000000000002'::uuid,
    'Sample Everyday Daypack',
    'sample-everyday-daypack',
    58.00::numeric,
    49.00::numeric,
    '{"html":"<p>Sample product copy for a compact daypack. Replace capacity, dimensions, and materials before launch.</p>"}'::jsonb,
    'active',
    'accessory',
    120,
    null::jsonb,
    'none'
  )
) as product(id, title, slug, original_price, current_price, description, status, product_type, sort, size_chart, sizing_mode)
cross join store_template_context context
where context.should_seed
on conflict do nothing;

insert into public.product_categories (product_id, category_id)
select link.product_id, link.category_id
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid)
) as link(product_id, category_id)
join public.products product on product.id = link.product_id
join public.categories category on category.id = link.category_id
cross join store_template_context context
where context.should_seed
on conflict do nothing;

insert into public.product_images (id, product_id, path, alt, is_main, sort)
select image.id, image.product_id, image.path, image.alt, image.is_main, image.sort
from (values
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'store-template/v1/products/essential-tee-01.png', 'Sample Essential Tee front view', true, 10),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'store-template/v1/products/essential-tee-02.png', 'Sample Essential Tee detail', false, 20),
  ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 'store-template/v1/products/daypack-01.png', 'Sample Everyday Daypack front view', true, 10),
  ('30000000-0000-4000-8000-000000000004'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 'store-template/v1/products/daypack-02.png', 'Sample Everyday Daypack detail', false, 20)
) as image(id, product_id, path, alt, is_main, sort)
join public.products product on product.id = image.product_id
cross join store_template_context context
where context.should_seed
on conflict do nothing;

insert into public.product_variants (
  id, product_id, size, color, sku, stock_quantity, low_stock_threshold
)
select variant.id, variant.product_id, variant.size, variant.color, variant.sku,
       variant.stock_quantity, variant.low_stock_threshold
from (values
  ('40000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'S', 'Natural', 'SAMPLE-TEE-S-NAT', 12, 3),
  ('40000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'M', 'Natural', 'SAMPLE-TEE-M-NAT', 12, 3),
  ('40000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'L', 'Natural', 'SAMPLE-TEE-L-NAT', 12, 3),
  ('40000000-0000-4000-8000-000000000004'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, null, 'Black', 'SAMPLE-PACK-BLK', 10, 2)
) as variant(id, product_id, size, color, sku, stock_quantity, low_stock_threshold)
join public.products product on product.id = variant.product_id
cross join store_template_context context
where context.should_seed
on conflict do nothing;

insert into public.banners (
  id, section_type, title, subtitle, image_path, mobile_image_path,
  cta_label, cta_url, sort, active
)
select
  '50000000-0000-4000-8000-000000000001'::uuid,
  'banner',
  'A fresh collection is ready',
  'Replace this sample copy and imagery before launch.',
  'store-template/v1/home/hero-desktop.png',
  'store-template/v1/home/hero-mobile.png',
  'Shop sample products',
  '/product',
  10,
  true
from store_template_context context
where context.should_seed
on conflict do nothing;

-- Remove the generated migration layout only when all rows are unchanged.
-- A changed or additional row preserves the whole set.
delete from public.homepage_sections section
using store_template_context context
where context.should_seed
  and (select count(*) from public.homepage_sections) = 14
  and (select count(*) from public.homepage_sections where type = 'banner') = 1
  and (select count(*) from public.homepage_sections where type = 'categories') = 1
  and (select count(*) from public.homepage_sections where type = 'featured') = 1
  and (select count(*) from public.homepage_sections where type = 'reviews') = 1
  and (select count(*) from public.homepage_sections where type = 'promo') = 1
  and (select count(*) from public.homepage_sections where type = 'richtext') = 1
  and (select count(*) from public.homepage_sections where type = 'banner_v2') = 1
  and (select count(*) from public.homepage_sections where type = 'categories_v2') = 1
  and (select count(*) from public.homepage_sections where type = 'featured_v2') = 1
  and (select count(*) from public.homepage_sections where type = 'reviews_v2') = 1
  and (select count(*) from public.homepage_sections where type = 'promo_v2') = 1
  and (select count(*) from public.homepage_sections where type = 'richtext_v2') = 1
  and (select count(*) from public.homepage_sections where type = 'deals') = 1
  and (select count(*) from public.homepage_sections where type = 'new_arrivals') = 1
  and not exists (
    select 1
    from public.homepage_sections existing
    where existing.body is not null
       or (existing.type not in ('deals', 'new_arrivals') and existing.config <> '{}'::jsonb)
       or not (
         (existing.type = 'banner' and existing.title is null and existing.subtitle is null and existing.sort = 10 and existing.active)
         or (existing.type = 'categories' and existing.title = 'Shop by Category' and existing.subtitle = 'Find your fit across every collection' and existing.sort = 20 and existing.active)
         or (existing.type = 'featured' and existing.title = 'Featured Gear' and existing.subtitle = 'Handpicked pieces from the latest drop' and existing.sort = 30 and existing.active)
         or (existing.type = 'reviews' and existing.title = 'What People Say' and existing.subtitle = 'Real photos from the VE Gear community' and existing.sort = 40 and existing.active)
         or (existing.type = 'promo' and existing.title is null and existing.subtitle is null and existing.sort = 41 and existing.active)
         or (existing.type = 'richtext' and existing.title = 'Our Story' and existing.subtitle is null and existing.sort = 42 and not existing.active)
         or (existing.type = 'banner_v2' and existing.title is null and existing.subtitle is null and existing.sort = 43 and not existing.active)
         or (existing.type = 'categories_v2' and existing.title = 'Shop by Category' and existing.subtitle = 'Find your fit' and existing.sort = 44 and not existing.active)
         or (existing.type = 'featured_v2' and existing.title = 'Featured Gear' and existing.subtitle = 'Latest drops' and existing.sort = 45 and not existing.active)
         or (existing.type = 'reviews_v2' and existing.title = 'From the Community' and existing.subtitle is null and existing.sort = 46 and not existing.active)
         or (existing.type = 'promo_v2' and existing.title is null and existing.subtitle is null and existing.sort = 47 and not existing.active)
         or (existing.type = 'richtext_v2' and existing.title = 'Our Story' and existing.subtitle is null and existing.sort = 48 and not existing.active)
         or (existing.type = 'deals' and existing.title = 'Today''s Best Deals' and existing.subtitle = 'Save on selected products' and existing.sort = 49 and not existing.active and existing.config = '{"limit":4,"cta_label":"View all products","cta_url":"/product"}'::jsonb)
         or (existing.type = 'new_arrivals' and existing.title = 'New Arrival Products' and existing.subtitle = 'Discover the latest additions' and existing.sort = 50 and not existing.active and existing.config = '{"limit":4,"cta_label":"View all products","cta_url":"/product"}'::jsonb)
       )
  );

insert into public.homepage_sections (
  id, type, title, subtitle, body, sort, active, config
)
select section.id, section.type, section.title, section.subtitle,
       section.body, section.sort, section.active, section.config
from (values
  ('60000000-0000-4000-8000-000000000001'::uuid, 'banner', null, null, null, 10, true, '{}'::jsonb),
  ('60000000-0000-4000-8000-000000000002'::uuid, 'categories', 'Shop by category', 'Start with these sample collections', null, 20, true, '{"cta_label":"View all products","cta_url":"/product"}'::jsonb),
  ('60000000-0000-4000-8000-000000000003'::uuid, 'featured', 'Featured products', 'Sample products ready to customize', null, 30, true, '{"limit":5,"cta_label":"View all products","cta_url":"/product"}'::jsonb),
  ('60000000-0000-4000-8000-000000000004'::uuid, 'promo', 'New-store offer', 'Replace this placeholder promotion before launch', null, 40, true, '{"promotion_id":"70000000-0000-4000-8000-000000000001"}'::jsonb),
  ('60000000-0000-4000-8000-000000000005'::uuid, 'reviews', 'Sample review', 'Replace with verified customer feedback', null, 50, true, '{"limit":12}'::jsonb),
  ('60000000-0000-4000-8000-000000000006'::uuid, 'richtext', 'Built for everyday use', null, '<p>This is placeholder homepage content. Tell customers what makes the store distinctive.</p>', 60, true, '{"layout":"simple","image_bucket":"branding","cards":[]}'::jsonb),
  ('60000000-0000-4000-8000-000000000007'::uuid, 'banner_v2', null, null, null, 70, false, '{}'::jsonb),
  ('60000000-0000-4000-8000-000000000008'::uuid, 'categories_v2', 'Shop by category', 'Start with these sample collections', null, 80, false, '{}'::jsonb),
  ('60000000-0000-4000-8000-000000000009'::uuid, 'featured_v2', 'Featured products', 'Sample products ready to customize', null, 90, false, '{"limit":6,"cta_label":"View all products","cta_url":"/product"}'::jsonb),
  ('60000000-0000-4000-8000-000000000010'::uuid, 'reviews_v2', 'Sample review', 'Replace with verified customer feedback', null, 100, false, '{}'::jsonb),
  ('60000000-0000-4000-8000-000000000011'::uuid, 'promo_v2', 'New-store offer', 'Replace this placeholder promotion before launch', null, 110, false, '{}'::jsonb),
  ('60000000-0000-4000-8000-000000000012'::uuid, 'richtext_v2', 'Built for everyday use', null, '<p>This is placeholder homepage content. Tell customers what makes the store distinctive.</p>', 120, false, '{"layout":"feature","image_bucket":"branding","cards":[]}'::jsonb),
  ('60000000-0000-4000-8000-000000000013'::uuid, 'deals', 'Today''s Best Deals', 'Save on selected products', null, 130, false, '{"limit":5,"cta_label":"View all products","cta_url":"/product"}'::jsonb),
  ('60000000-0000-4000-8000-000000000014'::uuid, 'new_arrivals', 'New Arrival Products', 'Discover the latest additions', null, 140, false, '{"limit":5,"cta_label":"View all products","cta_url":"/product"}'::jsonb)
) as section(id, type, title, subtitle, body, sort, active, config)
cross join store_template_context context
where context.should_seed
  and not exists (
    select 1 from public.homepage_sections existing where existing.type = section.type
  )
on conflict do nothing;

insert into public.promotions (
  id, title, description, image_path, discount_percent,
  active, starts_at, ends_at, cta_url, cta_label
)
select
  '70000000-0000-4000-8000-000000000001'::uuid,
  'Sample welcome offer',
  'Placeholder promotion. Replace the copy, discount, dates, and image before launch.',
  'store-template/v1/promotions/welcome-offer.png',
  10.00,
  true,
  null,
  null,
  '/product',
  'Shop sample products'
from store_template_context context
where context.should_seed
on conflict do nothing;

insert into public.reviews (
  id, customer_name, image_path, rating, body, product_id, is_published
)
select
  '80000000-0000-4000-8000-000000000001'::uuid,
  'SAMPLE REVIEW - Replace before launch',
  'store-template/v1/reviews/sample-review.png',
  5,
  '[SAMPLE REVIEW] This placeholder demonstrates the review layout. Replace it with verified customer feedback before launch.',
  product.id,
  true
from store_template_context context
join public.products product
  on product.id = '20000000-0000-4000-8000-000000000001'::uuid
where context.should_seed
on conflict do nothing;

-- Deliberately no customers, orders, order items, payments, or shipments.
insert into provisioning.seed_state (seed_key, version)
select 'store-template', 1
from store_template_context context
where context.should_seed
on conflict (seed_key) do nothing;

commit;
