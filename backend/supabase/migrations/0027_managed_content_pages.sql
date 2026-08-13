alter table public.content_pages
  drop constraint if exists content_pages_slug_check;

alter table public.content_pages
  drop constraint if exists content_pages_slug_format_check;

alter table public.content_pages
  add constraint content_pages_slug_format_check
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
