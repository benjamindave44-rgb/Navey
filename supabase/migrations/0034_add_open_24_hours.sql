-- Round-the-clock places had to be entered as "12:00 AM" to "11:59 PM" on
-- every day, which reads as a shop that shuts for a minute at midnight and
-- takes fourteen fields to say something simple. Recorded as a fact instead,
-- so the page can say "Open 24 hours" and search engines can be told properly.
alter table public.spot_hours
  add column is_24_hours boolean not null default false;
