-- People must be able to delete their own account. Two things were missing.

-- 1. business_claims.reviewed_by had no delete rule, so once an admin had
--    reviewed a single claim their account could never be deleted -- the
--    foreign key would simply refuse. Who reviewed a claim is audit trail,
--    not something worth blocking erasure over, so it empties instead.
alter table public.business_claims
  drop constraint if exists business_claims_reviewed_by_fkey;

alter table public.business_claims
  add constraint business_claims_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (id) on delete set null;

-- 2. Deleting from auth.users normally needs the service role key, which must
--    never reach the browser. This runs as the definer instead, and can only
--    ever delete the caller: the id comes from the verified session, not from
--    anything the caller sends.
--
--    Submitted spots survive (submitted_by is SET NULL) because a listing is
--    about a business, not its contributor. Reviews and saved lists are the
--    person's own content and cascade away with them.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not signed in';
  end if;

  delete from auth.users where id = caller;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
