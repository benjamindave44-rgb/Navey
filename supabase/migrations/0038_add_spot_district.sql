-- Nobody searches "coffee shops in Taguig". They search BGC, Poblacion,
-- Katipunan, Maginhawa -- the neighbourhood, not the administrative city.
-- With 18 listings in Taguig and 11 in Makati there is now enough behind a
-- district for its own page to be worth ranking.
--
-- Deliberately a plain nullable column rather than a table: a district only
-- ever needs a name, it belongs to whatever city the listing already states,
-- and a listing without one simply appears on its city page as before.

alter table public.spots
  add column if not exists district text;

comment on column public.spots.district is
  'Neighbourhood within the city (BGC, Poblacion, Katipunan). Optional; drives /area pages.';

create index if not exists spots_district_idx
  on public.spots (district)
  where district is not null and status = 'approved';
