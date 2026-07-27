-- Homepage picks were derived ("first hidden gem, else first spot"), so the
-- site couldn't honestly claim they were curated. Let an admin choose them.
alter table public.spots
  add column featured boolean not null default false,
  add column featured_rank integer not null default 0;

-- The homepage only ever reads the handful that are featured.
create index spots_featured_idx
  on public.spots (featured_rank, created_at desc)
  where featured;
