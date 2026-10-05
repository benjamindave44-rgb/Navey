-- Letting someone add a coffee shop without making an account first.
--
-- The gate costs submissions. Somebody five minutes into their first visit,
-- who knows a good place and wants to say so, does not make an account for a
-- directory they just found -- they close the tab. That is the whole reason to
-- open this up.
--
-- The problem it creates is credit. Nothing breaks when submitted_by is null --
-- src/lib/community.ts already filters those rows out of the feed and the
-- leaderboard -- but the submission becomes invisible to the contribution
-- system, which is the thing meant to reward it. So the identity is taken now
-- and attached later: name and email, no account, and if that person ever signs
-- up with the same address, everything they submitted becomes theirs
-- (claim_visitor_submissions, below).

alter table public.spots
  add column if not exists submitter_name text,
  add column if not exists submitter_email text;

comment on column public.spots.submitter_name is
  'Typed by a visitor with no account. NEVER rendered publicly: an unverified
   name on a public page is an impersonation waiting to happen. It exists so an
   admin can see who sent it, and so the row can be matched to an account later.
   The listing says "Submitted by a visitor" until submitted_by is filled.';

comment on column public.spots.submitter_email is
  'Also unverified. Used to reply, and to attach the submission to an account
   that later verifies the same address.';

-- Matching an address to its submissions on sign-up has to be quick, and only
-- unclaimed rows are ever of interest.
create index if not exists spots_unclaimed_submitter_idx
  on public.spots (lower(submitter_email))
  where submitted_by is null and submitter_email is not null;

/**
 * The only way an anonymous submission can be created.
 *
 * Deliberately a function rather than an insert policy for `anon`. A policy
 * would let anyone POST rows straight into `spots` through the API with no
 * limit at all; a function can refuse. Same reasoning as toggle_spot_reaction
 * in migration 0040, and the same warning applies: this is reachable over the
 * API by anyone, so it cannot trust one of its arguments.
 *
 * Three things keep it safe. Every row lands as `pending`, so nothing a
 * stranger sends is ever public until an admin approves it. Every field is
 * length-checked and the category is matched against the real list. And there
 * is a global hourly cap that no caller can influence -- the per-email limit
 * below it is trivially sidestepped by typing a different address, but the
 * global one is not, and it is what stops the review queue being buried.
 *
 * Returns the new id, or null when the submission was refused.
 */
create or replace function public.submit_spot_as_visitor(
  p_name text,
  p_address text,
  p_city text,
  p_province text,
  p_district text,
  p_category text,
  p_price_range text,
  p_description text,
  p_tag_ids integer[],
  p_submitter_name text,
  p_submitter_email text,
  p_lat double precision,
  p_lng double precision
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  new_id uuid;
  clean_email text;
  clean_name text;
begin
  -- Hostile input until proven otherwise.
  if length(btrim(coalesce(p_name, ''))) not between 2 and 120 then
    return null;
  end if;
  if length(btrim(coalesce(p_address, ''))) not between 4 and 300 then
    return null;
  end if;
  if length(btrim(coalesce(p_city, ''))) not between 2 and 80 then
    return null;
  end if;

  if p_category not in (
    'coffee_shop', 'restaurant', 'bakery', 'bar', 'dessert', 'milk_tea', 'both'
  ) then
    return null;
  end if;

  if p_price_range is not null and p_price_range not in ('₱', '₱₱', '₱₱₱') then
    return null;
  end if;

  clean_email := lower(btrim(coalesce(p_submitter_email, '')));
  -- Deliberately loose. This is for replying to somebody, not for proving who
  -- they are, and a strict pattern rejects more real addresses than fake ones.
  if clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or length(clean_email) > 160 then
    return null;
  end if;

  clean_name := left(btrim(coalesce(p_submitter_name, '')), 80);
  if length(clean_name) < 2 then
    return null;
  end if;

  -- The cap that actually matters: not keyed on anything the caller controls,
  -- so it holds however many addresses someone invents.
  if not public.check_rate_limit('visitor_submit:all', 60, interval '1 hour') then
    return null;
  end if;

  -- And a per-address limit, which stops the ordinary accident of somebody
  -- pressing submit five times.
  if not public.check_rate_limit('visitor_submit:' || clean_email, 5, interval '1 hour') then
    return null;
  end if;

  insert into public.spots (
    name, address, city, province, district, category, price_range,
    description, lat, lng, status, submitted_by,
    submitter_name, submitter_email
  )
  values (
    btrim(p_name),
    btrim(p_address),
    btrim(p_city),
    nullif(btrim(coalesce(p_province, '')), ''),
    nullif(btrim(coalesce(p_district, '')), ''),
    p_category,
    nullif(p_price_range, ''),
    nullif(left(btrim(coalesce(p_description, '')), 2000), ''),
    p_lat,
    p_lng,
    -- Not negotiable. Nothing from a stranger is public without an admin.
    'pending',
    null,
    clean_name,
    clean_email
  )
  returning id into new_id;

  -- Tags are matched against real rows, so an invented id inserts nothing
  -- rather than failing the whole submission.
  if p_tag_ids is not null and array_length(p_tag_ids, 1) > 0 then
    insert into public.spot_tags (spot_id, tag_id)
    select new_id, t.id
    from public.tags t
    where t.id = any(p_tag_ids)
    limit 20;
  end if;

  return new_id;
end;
$function$;

revoke execute on function public.submit_spot_as_visitor(
  text, text, text, text, text, text, text, text, integer[], text, text,
  double precision, double precision
) from public;

grant execute on function public.submit_spot_as_visitor(
  text, text, text, text, text, text, text, text, integer[], text, text,
  double precision, double precision
) to anon, authenticated;

/**
 * Hands a new account everything it submitted before it existed.
 *
 * This is the point of the whole design. It turns "make an account to submit"
 * -- which nobody does on a first visit -- into "claim the three shops you
 * already added", which is a far better reason to sign up, because the work is
 * already done.
 *
 * Runs as the signed-in person and matches on their own verified address only,
 * so nobody can claim somebody else's submissions by typing their email into
 * the form. Returns how many were attached.
 */
create or replace function public.claim_visitor_submissions()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  claimed integer;
  caller uuid;
  caller_email text;
begin
  caller := auth.uid();
  if caller is null then
    return 0;
  end if;

  -- Read from auth.users rather than from the request: this is the address
  -- Supabase holds for the account, not one the caller can assert.
  select lower(email) into caller_email from auth.users where id = caller;
  if caller_email is null or caller_email = '' then
    return 0;
  end if;

  update public.spots
  set submitted_by = caller
  where submitted_by is null
    and submitter_email is not null
    and lower(submitter_email) = caller_email;

  get diagnostics claimed = row_count;
  return claimed;
end;
$function$;

revoke execute on function public.claim_visitor_submissions() from public;
grant execute on function public.claim_visitor_submissions() to authenticated;
