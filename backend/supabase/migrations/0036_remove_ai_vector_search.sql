drop trigger if exists trg_invalidate_product_embedding_from_product on public.products;
drop trigger if exists trg_invalidate_product_embedding_from_category on public.categories;
drop trigger if exists trg_invalidate_product_embedding_from_category_link on public.product_categories;
drop trigger if exists trg_invalidate_product_embedding_from_variant on public.product_variants;

drop function if exists public.invalidate_product_embedding_from_product();
drop function if exists public.invalidate_product_embedding_from_category();
drop function if exists public.invalidate_product_embedding_from_category_link();
drop function if exists public.invalidate_product_embedding_from_variant();
drop function if exists public.get_product_embedding_sources(integer);
drop function if exists public.store_product_embedding(uuid, extensions.vector, text, text);
drop function if exists public.match_product_embeddings(extensions.vector, numeric, integer);
drop function if exists public.delete_product_embedding(uuid);
drop function if exists public.build_product_embedding_source(uuid);

drop table if exists public.product_embeddings;
drop extension if exists vector;

notify pgrst, 'reload schema';
