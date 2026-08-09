-- Dedicated logo for white-paper invoices. Storefront and email logos remain unchanged.

alter table public.site_settings
  add column if not exists invoice_logo_path text;

comment on column public.site_settings.invoice_logo_path is
  'Optional branding bucket object path for print-safe invoice PDFs.';
