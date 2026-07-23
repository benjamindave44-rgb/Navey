create table public.spot_photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  url text not null,
  kind text not null default 'gallery' check (kind in ('gallery', 'menu', 'spotlight')),
  created_at timestamptz not null default now()
);

alter table public.spot_photos enable row level security;

create policy "Spot photos are publicly readable"
  on public.spot_photos for select
  using (true);

create policy "Submitters can add photos to their own pending spot"
  on public.spot_photos for insert
  with check (
    spot_id in (select id from public.spots where submitted_by = auth.uid())
  );

create table public.spot_hours (
  spot_id uuid not null references public.spots (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time text,
  close_time text,
  is_closed boolean not null default false,
  primary key (spot_id, day_of_week)
);

alter table public.spot_hours enable row level security;

create policy "Spot hours are publicly readable"
  on public.spot_hours for select
  using (true);

create policy "Submitters can set hours for their own pending spot"
  on public.spot_hours for insert
  with check (
    spot_id in (select id from public.spots where submitted_by = auth.uid())
  );
