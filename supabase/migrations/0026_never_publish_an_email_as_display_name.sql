-- A display name is public: it appears on reviews, profiles and the
-- leaderboard. People routinely type their email address into a "Name" box,
-- which would publish it to everyone. Strip anything after an @ so the worst
-- case is a username, never a contactable address.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  candidate := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    new.email
  );

  if candidate like '%@%' then
    candidate := split_part(candidate, '@', 1);
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Repair anyone already carrying an address as their public name.
update public.profiles
set display_name = split_part(display_name, '@', 1)
where display_name like '%@%';
