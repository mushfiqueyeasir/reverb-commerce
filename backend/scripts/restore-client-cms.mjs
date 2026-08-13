import { join } from "node:path";
import {
  loadClient,
  parseArguments,
  parseEnvFile,
  repositoryRoot,
} from "./client-registry.mjs";
import { requestJson, responseRows, sqlLiteral } from "./provisioning-core.mjs";

const args = parseArguments();
if (typeof args.client !== "string") {
  throw new Error("Usage: node scripts/restore-client-cms.mjs --client <id>");
}

const { manifest } = loadClient(args.client);
const hasSelection =
  args.banners === true || args.sections === true || args.pages === true;
const restoreBanners = !hasSelection || args.banners === true;
const restoreSections = !hasSelection || args.sections === true;
const restorePages = !hasSelection || args.pages === true;
const bindProject = args["bind-project"] === true;
const secrets = parseEnvFile(
  join(repositoryRoot, ".client-secrets", `${manifest.id}.env`),
);
const token = secrets.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required");

const query = `
begin;
select pg_advisory_xact_lock(hashtext('restore-client-cms-fallback'));

create table if not exists provisioning.client_registry_bindings (
  client_id text primary key,
  project_ref text not null unique,
  bound_at timestamptz not null default now()
);
${bindProject ? `insert into provisioning.client_registry_bindings (client_id, project_ref)
values (${sqlLiteral(manifest.id)}, ${sqlLiteral(manifest.supabase.projectRef)})
on conflict (client_id) do nothing;` : ""}

do $$
begin
  if not exists (
    select 1
    from provisioning.client_registry_bindings
    where client_id = ${sqlLiteral(manifest.id)}
      and project_ref = ${sqlLiteral(manifest.supabase.projectRef)}
  ) then
    raise exception 'Supabase project is not bound to this client; rerun with --bind-project after verification';
  end if;
  ${restoreBanners ? `if coalesce(jsonb_array_length((select socials #> '{_cms,banners}' from public.site_settings where id = 1)), 0) = 0 then
    raise exception 'CMS fallback has no banners';
  end if;` : ""}
  ${restoreSections ? `if coalesce(jsonb_array_length((select socials #> '{_cms,homepage_sections}' from public.site_settings where id = 1)), 0) = 0 then
    raise exception 'CMS fallback has no homepage sections';
  end if;` : ""}
  ${restorePages ? `if coalesce((
    select count(*)
    from public.site_settings settings,
      lateral jsonb_object_keys(settings.socials #> '{_cms,pages}')
    where settings.id = 1
  ), 0) = 0 then
    raise exception 'CMS fallback has no content pages';
  end if;` : ""}
end $$;

create table if not exists provisioning.cms_fallback_restorations (
  client_id text not null,
  entity text not null,
  restored_at timestamptz not null default now(),
  primary key (client_id, entity)
);

create table if not exists provisioning.cms_recovery_backups (
  id bigint generated always as identity primary key,
  client_id text not null,
  banners jsonb not null,
  homepage_sections jsonb not null,
  content_pages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table provisioning.cms_recovery_backups
  add column if not exists content_pages jsonb not null default '[]'::jsonb;

insert into provisioning.cms_recovery_backups (
  client_id, banners, homepage_sections, content_pages
)
select
  '${manifest.id}',
  coalesce((select jsonb_agg(to_jsonb(row) order by row.sort) from public.banners row), '[]'::jsonb),
  coalesce((select jsonb_agg(to_jsonb(row) order by row.sort) from public.homepage_sections row), '[]'::jsonb),
  coalesce((select jsonb_agg(to_jsonb(row) order by row.slug) from public.content_pages row), '[]'::jsonb);

${restoreBanners ? `delete from public.banners;
insert into public.banners (
  id, section_type, title, subtitle, image_path, mobile_image_path,
  cta_label, cta_url, sort, active, starts_at, ends_at, created_at, updated_at
)
select
  row.id,
  coalesce(row.section_type, 'banner'),
  row.title,
  row.subtitle,
  row.image_path,
  row.mobile_image_path,
  row.cta_label,
  row.cta_url,
  row.sort,
  row.active,
  row.starts_at,
  row.ends_at,
  coalesce(row.created_at, now()),
  coalesce(row.updated_at, now())
from public.site_settings settings
cross join lateral jsonb_to_recordset(settings.socials #> '{_cms,banners}') as row(
  id uuid,
  section_type text,
  title text,
  subtitle text,
  image_path text,
  mobile_image_path text,
  cta_label text,
  cta_url text,
  sort int,
  active boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
where settings.id = 1;` : ""}

${restoreSections ? `delete from public.homepage_sections;
insert into public.homepage_sections (
  id, type, title, subtitle, body, sort, active, config, created_at, updated_at
)
select
  row.id,
  case when row.type = 'hero' then 'banner' else row.type end,
  row.title,
  row.subtitle,
  row.body,
  row.sort,
  row.active,
  coalesce(row.config, '{}'::jsonb),
  coalesce(row.created_at, now()),
  coalesce(row.updated_at, now())
from public.site_settings settings
cross join lateral jsonb_to_recordset(settings.socials #> '{_cms,homepage_sections}') as row(
  id uuid,
  type text,
  title text,
  subtitle text,
  body text,
  sort int,
  active boolean,
  config jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
where settings.id = 1;` : ""}

${restorePages ? `delete from public.content_pages;
insert into public.content_pages (slug, title, body_html, updated_at)
select
  page.key,
  page.value ->> 'title',
  coalesce(page.value ->> 'body_html', ''),
  coalesce((page.value ->> 'updated_at')::timestamptz, now())
from public.site_settings settings
cross join lateral jsonb_each(settings.socials #> '{_cms,pages}') page
where settings.id = 1;` : ""}

${restoreBanners ? `insert into provisioning.cms_fallback_restorations (client_id, entity)
values (${sqlLiteral(manifest.id)}, 'banners')
on conflict (client_id, entity) do update set restored_at = now();` : ""}
${restoreSections ? `insert into provisioning.cms_fallback_restorations (client_id, entity)
values (${sqlLiteral(manifest.id)}, 'homepage_sections')
on conflict (client_id, entity) do update set restored_at = now();` : ""}
${restorePages ? `insert into provisioning.cms_fallback_restorations (client_id, entity)
values (${sqlLiteral(manifest.id)}, 'content_pages')
on conflict (client_id, entity) do update set restored_at = now();` : ""}

commit;

select
  (select count(*)::int from public.banners) as banner_count,
  (select count(*)::int from public.homepage_sections) as section_count,
  (select count(*)::int from public.content_pages) as page_count,
  (select count(*)::int from public.banners where active) as active_banner_count,
  (select count(*)::int from public.homepage_sections where active) as active_section_count;
`;

const result = await requestJson(
  `https://api.supabase.com/v1/projects/${manifest.supabase.projectRef}/database/query`,
  {
    token,
    method: "POST",
    body: { query },
    expected: [201],
  },
);
console.log(JSON.stringify(responseRows(result).at(-1)));
