create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  curator_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "Collections are publicly readable"
  on public.collections for select
  using (true);

create table public.collection_photos (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  url text not null,
  position integer not null default 0
);

alter table public.collection_photos enable row level security;

create policy "Collection photos are publicly readable"
  on public.collection_photos for select
  using (true);

create table public.collection_spots (
  collection_id uuid not null references public.collections (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  rank integer not null default 0,
  primary key (collection_id, spot_id)
);

alter table public.collection_spots enable row level security;

create policy "Collection spots are publicly readable"
  on public.collection_spots for select
  using (true);
