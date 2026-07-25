-- Prevent users from granting themselves admin/owner via the existing
-- "update own profile" policy, which had no column-level restriction.
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_role_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_self_role_escalation();

-- Admins can see every spot regardless of status, for the review queue.
create policy "Admins can view all spots"
  on public.spots for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can approve/reject any spot.
create policy "Admins can update any spot"
  on public.spots for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
