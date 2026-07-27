-- The trigger only read raw_user_meta_data->>'display_name', which is set by
-- the email signup form. Google sends 'full_name'/'name' instead, so an OAuth
-- signup fell through to new.email -- publishing the person's full email
-- address as their public display name on reviews, profiles and the
-- leaderboard.
--
-- Prefer the real name from either source, and if neither exists fall back to
-- the local part of the address rather than the whole thing.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
