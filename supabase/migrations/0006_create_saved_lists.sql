create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.saved_lists enable row level security;

create policy "Public lists are readable by everyone, private lists by their owner"
  on public.saved_lists for select
  using (is_public = true or user_id = auth.uid());

create policy "Users can create their own lists"
  on public.saved_lists for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own lists"
  on public.saved_lists for update
  using (user_id = auth.uid());

create policy "Users can delete their own lists"
  on public.saved_lists for delete
  using (user_id = auth.uid());

create table public.saved_list_spots (
  list_id uuid not null references public.saved_lists (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  primary key (list_id, spot_id)
);

alter table public.saved_list_spots enable row level security;

create policy "Saved list spots follow the list's visibility"
  on public.saved_list_spots for select
  using (
    list_id in (
      select id from public.saved_lists
      where is_public = true or user_id = auth.uid()
    )
  );

create policy "Users can add spots to their own list"
  on public.saved_list_spots for insert
  with check (
    list_id in (select id from public.saved_lists where user_id = auth.uid())
  );

create policy "Users can remove spots from their own list"
  on public.saved_list_spots for delete
  using (
    list_id in (select id from public.saved_lists where user_id = auth.uid())
  );
