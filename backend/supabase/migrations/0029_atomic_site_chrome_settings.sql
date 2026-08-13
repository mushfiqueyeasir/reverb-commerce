update public.site_settings
set socials = coalesce(socials, '{}'::jsonb) - 'payment_image_path'
where id = 1;

create or replace function public.update_cms_section(
  p_section text,
  p_value jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_section not in ('navbar', 'footer') then
    raise exception 'Unsupported CMS section';
  end if;

  update public.site_settings
  set
    socials = jsonb_set(
      jsonb_set(
        case
          when jsonb_typeof(socials) = 'object' then socials
          else '{}'::jsonb
        end,
        '{_cms}',
        case
          when jsonb_typeof(socials -> '_cms') = 'object' then socials -> '_cms'
          else '{}'::jsonb
        end,
        true
      ),
      array['_cms', p_section],
      coalesce(p_value, '{}'::jsonb),
      true
    ),
    updated_at = now()
  where id = 1;

  if not found then
    raise exception 'Site settings were not found';
  end if;
end;
$$;

revoke all on function public.update_cms_section(text, jsonb) from public;
grant execute on function public.update_cms_section(text, jsonb) to authenticated, service_role;
