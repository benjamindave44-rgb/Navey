-- Reviews could only ever be deleted by their own author, so an abusive or
-- fake one was unremovable without direct database access. Spots already had
-- a needs_review flag and an admin path; reviews had neither.

alter table public.reviews
  add column needs_review boolean not null default false;

create index reviews_needs_review_idx on public.reviews (created_at desc)
  where needs_review;

-- Readers are the ones who find bad content; a keyword check never will.
-- One report per person per review, enforced by the primary key.
--
-- Careful: holding a foreign key to both reviews and profiles makes this a
-- join table between them, so PostgREST sees two ways to get from a review to
-- a profile and refuses to guess (PGRST201). Every embed of profiles under
-- reviews must name the constraint -- profiles!reviews_user_id_fkey -- or the
-- whole query fails, not just the author's name.
create table public.review_reports (
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (review_id, reporter_id)
);

alter table public.review_reports enable row level security;

create policy "Signed-in users can report a review"
  on public.review_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Deliberately no public select: who reported what is not readable by other
-- users, only by admins acting on it.
create policy "Admins can read reports"
  on public.review_reports for select
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can moderate any review"
  on public.reviews for update
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can remove any review"
  on public.reviews for delete
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );
