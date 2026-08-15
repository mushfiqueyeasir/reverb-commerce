create table if not exists provisioning.theme_builder_backups (
  migration_name text primary key,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

insert into provisioning.theme_builder_backups (migration_name, snapshot)
values (
  '0040_theme_builder_foundation',
  jsonb_build_object(
    'siteSettings', (
      select to_jsonb(settings)
      from public.site_settings settings
      where settings.id = 1
    ),
    'homepageSections', coalesce((
      select jsonb_agg(to_jsonb(section) order by section.sort, section.created_at)
      from public.homepage_sections section
    ), '[]'::jsonb),
    'banners', coalesce((
      select jsonb_agg(to_jsonb(banner) order by banner.sort, banner.created_at)
      from public.banners banner
    ), '[]'::jsonb)
  )
)
on conflict (migration_name) do nothing;

create table public.theme_revisions (
  id                 uuid primary key default gen_random_uuid(),
  revision_number    bigint unique,
  status             text not null check (status in ('draft', 'published')),
  theme_key          text not null check (theme_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  schema_version     integer not null check (schema_version > 0),
  version            bigint not null default 1 check (version > 0),
  manifest           jsonb not null check (jsonb_typeof(manifest) = 'object'),
  design_config      jsonb not null check (jsonb_typeof(design_config) = 'object'),
  source_revision_id uuid references public.theme_revisions (id) on delete restrict,
  created_by         uuid,
  updated_by         uuid,
  published_by       uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  published_at       timestamptz,
  check (
    (status = 'draft' and revision_number is null and published_at is null)
    or
    (status = 'published' and revision_number > 0 and published_at is not null)
  )
);

create unique index theme_revisions_single_draft_idx
  on public.theme_revisions ((status))
  where status = 'draft';

create index theme_revisions_published_history_idx
  on public.theme_revisions (revision_number desc)
  where status = 'published';

create table public.theme_state (
  singleton             boolean primary key default true check (singleton),
  published_revision_id uuid not null unique references public.theme_revisions (id) on delete restrict,
  updated_at            timestamptz not null default now()
);

create or replace function public.prevent_published_theme_revision_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'published' then
    raise exception 'published theme revisions are immutable';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.validate_theme_revision_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.theme_revisions where status = 'draft') <> 1 then
    raise exception 'exactly one theme draft is required';
  end if;
  if not exists (
    select 1
    from public.theme_state state
    join public.theme_revisions revision
      on revision.id = state.published_revision_id
    where state.singleton
      and revision.status = 'published'
  ) then
    raise exception 'a current published theme revision is required';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_theme_revisions_touch on public.theme_revisions;
create trigger trg_theme_revisions_touch
  before update on public.theme_revisions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_theme_revisions_z_immutable on public.theme_revisions;
create trigger trg_theme_revisions_z_immutable
  before update or delete on public.theme_revisions
  for each row execute function public.prevent_published_theme_revision_changes();

drop trigger if exists trg_theme_state_touch on public.theme_state;
create trigger trg_theme_state_touch
  before update on public.theme_state
  for each row execute function public.touch_updated_at();

create constraint trigger trg_theme_revisions_validate_state
  after insert or update or delete on public.theme_revisions
  deferrable initially deferred
  for each row execute function public.validate_theme_revision_state();

create constraint trigger trg_theme_state_validate_state
  after insert or update or delete on public.theme_state
  deferrable initially deferred
  for each row execute function public.validate_theme_revision_state();

do $$
declare
  v_published_id uuid := gen_random_uuid();
  v_draft_id uuid := gen_random_uuid();
  v_manifest jsonb;
  v_design_config jsonb;
  v_palette jsonb;
begin
  select case
    when jsonb_typeof(settings.socials #> '{_cms,palette}') = 'object'
      then settings.socials #> '{_cms,palette}'
    else jsonb_build_object(
      'primary', '#ff5c70',
      'primaryForeground', '#050505',
      'background', '#050505',
      'surface', '#111111',
      'card', '#161616',
      'foreground', '#f5f3ef',
      'mutedForeground', '#9a9a9a',
      'border', '#2a2a2a'
    )
  end
  into v_palette
  from public.site_settings settings
  where settings.id = 1;

  v_palette := coalesce(v_palette, jsonb_build_object(
    'primary', '#ff5c70',
    'primaryForeground', '#050505',
    'background', '#050505',
    'surface', '#111111',
    'card', '#161616',
    'foreground', '#f5f3ef',
    'mutedForeground', '#9a9a9a',
    'border', '#2a2a2a'
  ));

  v_manifest := jsonb_build_object(
    'id', 'legacy-classic',
    'version', 1
  );
  v_design_config := jsonb_build_object(
    'tokenOverrides', jsonb_build_object('palette', v_palette),
    'resolvedTokens', jsonb_build_object('palette', v_palette),
    'contentReferences', jsonb_build_object(
      'navbar', jsonb_build_object(
        'relation', 'site_settings',
        'selector', jsonb_build_object('id', 1),
        'path', jsonb_build_array('socials', '_cms', 'navbar')
      ),
      'footer', jsonb_build_object(
        'relation', 'site_settings',
        'selector', jsonb_build_object('id', 1),
        'path', jsonb_build_array('socials', '_cms', 'footer')
      ),
      'homepage', jsonb_build_object(
        'relation', 'homepage_sections',
        'orderBy', jsonb_build_array('sort', 'created_at')
      )
    )
  );

  insert into public.theme_revisions (
    id,
    revision_number,
    status,
    theme_key,
    schema_version,
    version,
    manifest,
    design_config,
    published_at
  ) values (
    v_published_id,
    1,
    'published',
    'legacy-classic',
    1,
    1,
    v_manifest,
    v_design_config,
    now()
  );

  insert into public.theme_revisions (
    id,
    status,
    theme_key,
    schema_version,
    version,
    manifest,
    design_config,
    source_revision_id
  ) values (
    v_draft_id,
    'draft',
    'legacy-classic',
    1,
    1,
    v_manifest,
    v_design_config,
    v_published_id
  );

  insert into public.theme_state (singleton, published_revision_id)
  values (true, v_published_id);
end;
$$;

create or replace function public.save_theme_draft(
  p_expected_version bigint,
  p_theme_key text,
  p_schema_version integer,
  p_manifest jsonb,
  p_design_config jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_draft public.theme_revisions;
begin
  if auth.role() <> 'service_role'
    and (v_actor is null or not public.is_admin()) then
    raise exception 'permission denied';
  end if;
  if p_theme_key is null or p_theme_key !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid theme key';
  end if;
  if p_schema_version is null or p_schema_version < 1 then
    raise exception 'invalid theme schema version';
  end if;
  if jsonb_typeof(p_manifest) is distinct from 'object' then
    raise exception 'theme manifest must be an object';
  end if;
  if p_manifest ->> 'id' is distinct from p_theme_key
    or jsonb_typeof(p_manifest -> 'version') is distinct from 'number'
    or (p_manifest ->> 'version') !~ '^[1-9][0-9]*$' then
    raise exception 'theme manifest reference is invalid';
  end if;
  if jsonb_typeof(p_design_config) is distinct from 'object' then
    raise exception 'theme design config must be an object';
  end if;
  if jsonb_typeof(p_design_config #> '{resolvedTokens,palette}')
    is distinct from 'object' then
    raise exception 'resolved theme palette is required';
  end if;

  select *
  into v_draft
  from public.theme_revisions
  where status = 'draft'
  for update;

  if not found then
    raise exception 'theme draft was not found';
  end if;
  if v_draft.version is distinct from p_expected_version then
    raise exception 'theme draft version conflict' using errcode = '40001';
  end if;

  update public.theme_revisions
  set
    theme_key = p_theme_key,
    schema_version = p_schema_version,
    version = version + 1,
    manifest = p_manifest,
    design_config = p_design_config,
    updated_by = v_actor
  where id = v_draft.id
  returning * into v_draft;

  return jsonb_build_object('draft', to_jsonb(v_draft));
end;
$$;

create or replace function public.publish_theme_draft(
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_draft public.theme_revisions;
  v_published public.theme_revisions;
  v_next_draft public.theme_revisions;
  v_revision_number bigint;
begin
  if auth.role() <> 'service_role'
    and (v_actor is null or not public.is_admin()) then
    raise exception 'permission denied';
  end if;

  perform 1
  from public.theme_state
  where singleton
  for update;
  if not found then
    raise exception 'theme state was not found';
  end if;

  select *
  into v_draft
  from public.theme_revisions
  where status = 'draft'
  for update;
  if not found then
    raise exception 'theme draft was not found';
  end if;
  if v_draft.version is distinct from p_expected_version then
    raise exception 'theme draft version conflict' using errcode = '40001';
  end if;

  select coalesce(max(revision_number), 0) + 1
  into v_revision_number
  from public.theme_revisions
  where status = 'published';

  update public.theme_revisions
  set
    revision_number = v_revision_number,
    status = 'published',
    updated_by = v_actor,
    published_by = v_actor,
    published_at = now()
  where id = v_draft.id
  returning * into v_published;

  insert into public.theme_revisions (
    status,
    theme_key,
    schema_version,
    version,
    manifest,
    design_config,
    source_revision_id,
    created_by,
    updated_by
  ) values (
    'draft',
    v_published.theme_key,
    v_published.schema_version,
    v_published.version + 1,
    v_published.manifest,
    v_published.design_config,
    v_published.id,
    v_actor,
    v_actor
  )
  returning * into v_next_draft;

  update public.theme_state
  set published_revision_id = v_published.id
  where singleton;

  update public.site_settings
  set socials = jsonb_set(
    coalesce(socials, '{}'::jsonb),
    '{_cms}',
    coalesce(socials -> '_cms', '{}'::jsonb) || jsonb_build_object(
      'palette',
      v_published.design_config #> '{resolvedTokens,palette}'
    ),
    true
  )
  where id = 1;

  return jsonb_build_object(
    'published', to_jsonb(v_published),
    'draft', to_jsonb(v_next_draft)
  );
end;
$$;

create or replace function public.rollback_theme_revision(
  p_revision_id uuid,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_current_id uuid;
  v_source public.theme_revisions;
  v_draft public.theme_revisions;
  v_published public.theme_revisions;
  v_revision_number bigint;
begin
  if auth.role() <> 'service_role'
    and (v_actor is null or not public.is_admin()) then
    raise exception 'permission denied';
  end if;

  select published_revision_id
  into v_current_id
  from public.theme_state
  where singleton
  for update;
  if not found then
    raise exception 'theme state was not found';
  end if;

  select *
  into v_draft
  from public.theme_revisions
  where status = 'draft'
  for update;
  if not found then
    raise exception 'theme draft was not found';
  end if;
  if v_draft.version is distinct from p_expected_version then
    raise exception 'theme draft version conflict' using errcode = '40001';
  end if;

  select *
  into v_source
  from public.theme_revisions
  where id = p_revision_id
    and status = 'published';
  if not found then
    raise exception 'published theme revision was not found';
  end if;
  if v_source.id = v_current_id then
    raise exception 'rollback requires a historical published revision';
  end if;

  select coalesce(max(revision_number), 0) + 1
  into v_revision_number
  from public.theme_revisions
  where status = 'published';

  insert into public.theme_revisions (
    revision_number,
    status,
    theme_key,
    schema_version,
    version,
    manifest,
    design_config,
    source_revision_id,
    created_by,
    updated_by,
    published_by,
    published_at
  ) values (
    v_revision_number,
    'published',
    v_source.theme_key,
    v_source.schema_version,
    v_draft.version + 1,
    v_source.manifest,
    v_source.design_config,
    v_source.id,
    v_actor,
    v_actor,
    v_actor,
    now()
  )
  returning * into v_published;

  update public.theme_revisions
  set
    theme_key = v_source.theme_key,
    schema_version = v_source.schema_version,
    version = version + 1,
    manifest = v_source.manifest,
    design_config = v_source.design_config,
    source_revision_id = v_published.id,
    updated_by = v_actor
  where id = v_draft.id
  returning * into v_draft;

  update public.theme_state
  set published_revision_id = v_published.id
  where singleton;

  update public.site_settings
  set socials = jsonb_set(
    coalesce(socials, '{}'::jsonb),
    '{_cms}',
    coalesce(socials -> '_cms', '{}'::jsonb) || jsonb_build_object(
      'palette',
      v_published.design_config #> '{resolvedTokens,palette}'
    ),
    true
  )
  where id = 1;

  return jsonb_build_object(
    'published', to_jsonb(v_published),
    'draft', to_jsonb(v_draft)
  );
end;
$$;

alter table public.theme_revisions enable row level security;
alter table public.theme_state enable row level security;

drop policy if exists theme_revisions_read on public.theme_revisions;
create policy theme_revisions_read on public.theme_revisions
  for select
  using (
    id = (
      select state.published_revision_id
      from public.theme_state state
      where state.singleton
    )
    or (auth.uid() is not null and public.is_admin())
  );

drop policy if exists theme_state_read on public.theme_state;
create policy theme_state_read on public.theme_state
  for select using (true);

revoke all on table public.theme_revisions from public, anon, authenticated, service_role;
revoke all on table public.theme_state from public, anon, authenticated, service_role;
grant select on table public.theme_revisions to anon, authenticated, service_role;
grant select on table public.theme_state to anon, authenticated, service_role;

revoke all on function public.prevent_published_theme_revision_changes() from public, anon, authenticated, service_role;
revoke all on function public.validate_theme_revision_state() from public, anon, authenticated, service_role;
revoke all on function public.save_theme_draft(bigint, text, integer, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.publish_theme_draft(bigint) from public, anon, authenticated, service_role;
revoke all on function public.rollback_theme_revision(uuid, bigint) from public, anon, authenticated, service_role;
grant execute on function public.save_theme_draft(bigint, text, integer, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.publish_theme_draft(bigint) to authenticated, service_role;
grant execute on function public.rollback_theme_revision(uuid, bigint) to authenticated, service_role;

notify pgrst, 'reload schema';
