-- Product and review photos are optimized client-side before upload. PNG stays
-- allowed only because the built-in store provisioning assets use it.
update storage.buckets
set
  file_size_limit = 4194304,
  allowed_mime_types = array['image/webp', 'image/png']::text[]
where id in ('product-images', 'review-images');
