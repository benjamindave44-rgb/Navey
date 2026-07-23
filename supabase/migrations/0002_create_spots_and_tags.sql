create table public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('coffee_shop', 'restaurant', 'both')),
  price_range text check (price_range in ('₱', '₱₱', '₱₱₱')),
  city text not null,
  province text,
  address text not null,
  lat double precision,
  lng double precision,
  description text,
  hidden_gem boolean not null default false,
  pwd_friendly boolean not null default false,
  save_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references public.profiles (id) on delete set null,
  noise_level text,
  music_style text,
  lighting text,
  seating_style text,
  accepts_cash boolean not null default true,
  accepts_qr_ph boolean not null default false,
  accepts_cards boolean not null default false,
  accepts_bank_transfer boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;

create policy "Approved spots are publicly readable, submitters see their own"
  on public.spots for select
  using (status = 'approved' or submitted_by = auth.uid());

create policy "Authenticated users can submit a spot"
  on public.spots for insert
  to authenticated
  with check (submitted_by = auth.uid());

create policy "Submitters can edit their own pending spot"
  on public.spots for update
  using (submitted_by = auth.uid() and status = 'pending');

create table public.tags (
  id serial primary key,
  label text not null unique,
  icon text
);

alter table public.tags enable row level security;

create policy "Tags are publicly readable"
  on public.tags for select
  using (true);

create table public.spot_tags (
  spot_id uuid not null references public.spots (id) on delete cascade,
  tag_id integer not null references public.tags (id) on delete cascade,
  primary key (spot_id, tag_id)
);

alter table public.spot_tags enable row level security;

create policy "Spot tags are publicly readable"
  on public.spot_tags for select
  using (true);

create policy "Submitters can tag their own pending spot"
  on public.spot_tags for insert
  with check (
    spot_id in (select id from public.spots where submitted_by = auth.uid())
  );
