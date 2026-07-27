create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Anyone may subscribe, but nobody may read the list back: without a select
-- policy an anonymous visitor can't enumerate subscriber emails.
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read subscribers"
  on public.newsletter_subscribers for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
