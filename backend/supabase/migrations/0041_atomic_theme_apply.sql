create or replace function public.apply_theme(
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
  v_saved jsonb;
  v_draft_version bigint;
  v_published jsonb;
begin
  if auth.role() <> 'service_role'
    and (v_actor is null or not public.is_admin()) then
    raise exception 'permission denied';
  end if;

  v_saved := public.save_theme_draft(
    p_expected_version,
    p_theme_key,
    p_schema_version,
    p_manifest,
    p_design_config
  );
  v_draft_version := (v_saved #>> '{draft,version}')::bigint;
  if v_draft_version is null or v_draft_version <= p_expected_version then
    raise exception 'theme apply returned an invalid draft version';
  end if;

  v_published := public.publish_theme_draft(v_draft_version);
  return v_published;
end;
$$;

revoke all on function public.apply_theme(bigint, text, integer, jsonb, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.apply_theme(bigint, text, integer, jsonb, jsonb)
  to authenticated, service_role;

notify pgrst, 'reload schema';
