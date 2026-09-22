-- One review, from four accounts, on a site that invites people to join a
-- community. Asking a stranger for a paragraph about a coffee shop is a large
-- favour; asking for one tap on the way out of the door is not. This is the
-- small version of the same question.
--
-- Both flattering and unflattering labels, on purpose. A board offering only
-- praise is read as marketing and believed by nobody, and "too noisy" is
-- exactly the fact a visitor most needs before driving across the city.
--
-- Two decisions worth stating, because neither is obvious:
--
-- 1. No account required. A vote is keyed on a random id the browser makes and
--    keeps (src/lib/use-reactions.ts). Someone determined to stuff the ballot
--    can clear their storage and vote again -- accepted knowingly. This is a
--    mood ring, not an election, and the alternative is a sign-in wall in
--    front of the one interaction anybody was ever going to complete.
--
-- 2. Written from the browser to Supabase directly, not through the app. A
--    server action would be a billed function invocation per tap on a hosting
--    plan that has already been over its limit once this year. Going straight
--    to the database makes a tap cost nothing on Vercel. That is why the rate
--    limit has to live in here rather than in the app: this function is
--    reachable over the API, so it cannot trust a single one of its arguments.

create table if not exists public.spot_reactions (
  spot_id uuid not null references public.spots (id) on delete cascade,
  -- A random id from the voter's browser, not an account and not an address.
  -- Bounded because it arrives from the client.
  voter_key text not null check (length(voter_key) between 8 and 64),
  label text not null check (
    label in (
      'good_for_working',
      'great_coffee',
      'great_food',
      'good_value',
      'too_noisy',
      'pricey'
    )
  ),
  created_at timestamptz not null default now(),
  -- One voter, one vote, per label, per spot. A second tap removes it rather
  -- than stacking, which is what makes this a toggle.
  primary key (spot_id, voter_key, label)
);

create index if not exists spot_reactions_spot_idx
  on public.spot_reactions (spot_id, label);

alter table public.spot_reactions enable row level security;

-- Dropped first because Postgres has no `create policy if not exists`, and the
-- rest of this file is re-runnable.
drop policy if exists "Reaction counts are public for approved spots"
  on public.spot_reactions;

-- Counts are public, for published listings only -- matching spot_price_anchors
-- and for the same reason: an unapproved listing should not leak anything
-- through a table nobody remembered to lock.
create policy "Reaction counts are public for approved spots"
  on public.spot_reactions
  for select
  using (
    exists (
      select 1
      from public.spots
      where spots.id = spot_reactions.spot_id
        and spots.status = 'approved'
    )
  );

-- Deliberately no insert or delete policy. Every write goes through the
-- function below, so the rate limit cannot be walked around by posting to the
-- table directly.

/**
 * Adds or removes one vote and returns the resulting count for that label.
 *
 * Returns -1 rather than raising when the allowance is spent, so the caller
 * can leave the button alone instead of showing an error for something this
 * unimportant.
 */
create or replace function public.toggle_spot_reaction(
  p_spot_id uuid,
  p_voter_key text,
  p_label text
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  key text;
  existing integer;
  total integer;
begin
  -- Validate everything. This is callable by anon over the API, so the
  -- arguments are hostile input, not parameters from our own code.
  key := btrim(coalesce(p_voter_key, ''));
  if length(key) < 8 or length(key) > 64 then
    return -1;
  end if;

  if p_label not in (
    'good_for_working', 'great_coffee', 'great_food',
    'good_value', 'too_noisy', 'pricey'
  ) then
    return -1;
  end if;

  -- Only published listings. Voting on a pending submission would let someone
  -- discover it exists before anybody approved it.
  if not exists (
    select 1 from public.spots
    where id = p_spot_id and status = 'approved'
  ) then
    return -1;
  end if;

  -- Thirty taps an hour is far more than an honest visitor needs and far less
  -- than a script wants. Reuses the existing limiter so there is one place in
  -- this database that knows how to count.
  if not public.check_rate_limit('react:' || key, 30, interval '1 hour') then
    return -1;
  end if;

  select count(*) into existing
  from public.spot_reactions
  where spot_id = p_spot_id and voter_key = key and label = p_label;

  if existing > 0 then
    delete from public.spot_reactions
    where spot_id = p_spot_id and voter_key = key and label = p_label;
  else
    insert into public.spot_reactions (spot_id, voter_key, label)
    values (p_spot_id, key, p_label)
    on conflict do nothing;
  end if;

  select count(*) into total
  from public.spot_reactions
  where spot_id = p_spot_id and label = p_label;

  return total;
end;
$function$;

revoke execute on function public.toggle_spot_reaction(uuid, text, text) from public;
grant execute on function public.toggle_spot_reaction(uuid, text, text) to anon, authenticated;

-- A listing page wants six numbers, not every vote ever cast. Reading the rows
-- and counting them in the app would work today, with no votes in the table,
-- and would quietly become a page that downloads thousands of rows to print
-- "12".
--
-- security_invoker so the view is read as whoever is asking rather than as its
-- owner. Without it a view over a table with row-level security bypasses that
-- security, which would expose counts for listings that are not approved yet.
create or replace view public.spot_reaction_counts
  with (security_invoker = on)
  as
    select spot_id, label, count(*)::integer as total
    from public.spot_reactions
    group by spot_id, label;
