delete from public.content_pages
where slug not in ('about', 'terms', 'privacy', 'refund');

update public.site_settings
set socials = socials - 'footer_links'
where socials ? 'footer_links';

alter table public.content_pages
  drop constraint if exists content_pages_slug_format_check;

alter table public.content_pages
  drop constraint if exists content_pages_slug_check;

alter table public.content_pages
  add constraint content_pages_slug_check
  check (slug in ('about', 'terms', 'privacy', 'refund'));
