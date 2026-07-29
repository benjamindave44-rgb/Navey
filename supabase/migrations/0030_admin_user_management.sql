-- Admins could not manage anyone: the only update policy on profiles is
-- "your own row", so changing another person's role was impossible, and the
-- role-guard trigger never got a chance to allow it.
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles me
            where me.id = auth.uid() and me.role = 'admin')
  );

-- Email addresses live in auth.users, which the app's client cannot read.
-- Support work needs them, so expose them to admins only, through a function
-- that checks the caller rather than trusting the query.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamptz,
  provider text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) then
    raise exception 'Admins only';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.role,
    p.created_at,
    (select string_agg(distinct i.provider, ', ')
     from auth.identities i where i.user_id = p.id)::text
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
