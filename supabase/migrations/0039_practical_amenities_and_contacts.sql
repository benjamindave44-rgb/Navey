-- The listings stored noise level, seating style, music style and lighting,
-- and not one of wifi, power outlets or aircon. Every atmosphere field and no
-- practical ones -- which is backwards, because nobody in Manila picks a cafe
-- on its lighting and half the market picks one on whether they can plug in.
--
-- Three-state rather than boolean, deliberately. `accepts_cards` and
-- `pwd_friendly` are `boolean not null default false`, so a listing nobody has
-- checked is indistinguishable from one confirmed to have none. That is the
-- same mistake open-status.ts exists to avoid: telling a visitor "no wifi"
-- because the row is thin sends them elsewhere and costs the shop a customer.
-- Null here means "not checked yet" and shows nothing at all.

alter table public.spots
  add column if not exists wifi text
    check (wifi in ('none', 'patchy', 'good')),
  add column if not exists power_outlets text
    check (power_outlets in ('none', 'few', 'plenty')),
  add column if not exists laptop_friendly text
    check (laptop_friendly in ('welcome', 'limited', 'discouraged')),
  add column if not exists has_aircon boolean,
  add column if not exists has_outdoor_seating boolean,
  add column if not exists parking text
    check (parking in ('none', 'street', 'building', 'valet'));

comment on column public.spots.wifi is
  'none | patchy | good. Null means nobody has checked -- shows no chip.';
comment on column public.spots.power_outlets is
  'none | few | plenty. Null means nobody has checked.';
comment on column public.spots.laptop_friendly is
  'welcome | limited (peak-hour limit) | discouraged. Null means unchecked.';
comment on column public.spots.parking is
  'none | street | building | valet. Null means nobody has checked.';

-- Contact details. A listing with no way to reach the shop is a dead end: the
-- visitor reads it, leaves, and searches Instagram themselves. Every coffee
-- shop in the country is on Instagram, so the handle is the most valuable of
-- these by a wide margin.
--
-- No column for directions. Every listing already carries lat/lng and an
-- address, so a maps link is built from what is here rather than stored a
-- second time and allowed to drift out of agreement with itself.
alter table public.spots
  add column if not exists instagram text,
  add column if not exists phone text,
  add column if not exists website text;

comment on column public.spots.instagram is
  'Handle only, stored without the @ and without a URL, so the link is built
   in one place. See src/lib/contact.ts.';

-- When the details were last confirmed by a person. A directory is only worth
-- opening if its opening hours are true, and the honest way to earn that is to
-- say out loud when somebody last looked. Cheaper than any redesign and worth
-- more.
alter table public.spots
  add column if not exists details_checked_at date;

comment on column public.spots.details_checked_at is
  'Date a human last confirmed hours/amenities. Null shows no line.';

-- A price bracket says nothing: "PP" is true of most of Metro Manila. A latte
-- at 170 and a croissant at 150 is the whole answer, and it is the one thing
-- Google Maps has never shown. Free text for the item because this covers
-- restaurants too, where the anchor is sisig, not a flat white.
--
-- A table rather than columns, because the useful anchors differ per listing
-- and a fixed `price_latte_php` would be null on every restaurant.
create table if not exists public.spot_price_anchors (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  item text not null check (length(btrim(item)) between 1 and 60),
  -- Pesos, whole, as written on the board. Integer because no menu in the
  -- country prices anything at 170.50, and a float would print as 170.5.
  price_php integer not null check (price_php > 0 and price_php < 100000),
  sort_order integer not null default 0
);

create index if not exists spot_price_anchors_spot_idx
  on public.spot_price_anchors (spot_id, sort_order);

alter table public.spot_price_anchors enable row level security;

-- Postgres has no `create policy if not exists`, and everything else in this
-- file is written to survive being applied twice. Dropped first so the whole
-- migration stays re-runnable rather than failing halfway through.
drop policy if exists "Price anchors are public for approved spots"
  on public.spot_price_anchors;
drop policy if exists "Admins manage price anchors"
  on public.spot_price_anchors;
drop policy if exists "Submitters manage their own price anchors"
  on public.spot_price_anchors;

-- Readable by everyone, but only for listings that are actually published --
-- matching how spot_photos and spot_tags behave, so an unapproved listing does
-- not leak its prices through a table nobody thought to lock.
create policy "Price anchors are public for approved spots"
  on public.spot_price_anchors
  for select
  using (
    exists (
      select 1
      from public.spots
      where spots.id = spot_price_anchors.spot_id
        and spots.status = 'approved'
    )
  );

create policy "Admins manage price anchors"
  on public.spot_price_anchors
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

-- Whoever submitted the listing maintains its prices, which is how the owner
-- area already decides what somebody may edit (requireOwnerAccess in
-- src/app/owner/[spotId]/actions.ts checks submitted_by, not the claims
-- table). Copied from the spot_photos policies rather than invented, so there
-- is one answer on this site to "who owns a listing".
create policy "Submitters manage their own price anchors"
  on public.spot_price_anchors
  for all
  using (
    spot_id in (
      select id from public.spots where submitted_by = (select auth.uid())
    )
  );

-- Filtering "somewhere I can work" has to be answerable without reading every
-- listing, so the two columns that question turns on get an index. Partial,
-- because a filter is only ever applied to published listings.
create index if not exists spots_work_friendly_idx
  on public.spots (wifi, power_outlets)
  where status = 'approved';
