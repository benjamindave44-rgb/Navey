create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "Authenticated users can write a review"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can edit their own review"
  on public.reviews for update
  using (user_id = auth.uid());

create policy "Users can delete their own review"
  on public.reviews for delete
  using (user_id = auth.uid());

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  url text not null
);

alter table public.review_photos enable row level security;

create policy "Review photos are publicly readable"
  on public.review_photos for select
  using (true);

create policy "Users can add photos to their own review"
  on public.review_photos for insert
  with check (
    review_id in (select id from public.reviews where user_id = auth.uid())
  );
