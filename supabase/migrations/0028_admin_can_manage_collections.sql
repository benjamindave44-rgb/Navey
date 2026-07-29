-- The collections tables carried read policies only, so nothing could create
-- or change one -- the seeded collection was inserted directly. With RLS on,
-- writes wouldn't error, they would silently affect nothing, so a management
-- screen had to start here rather than in the UI.
create policy "Admins can create collections"
  on public.collections for insert
  with check (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can update collections"
  on public.collections for update
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can delete collections"
  on public.collections for delete
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can add spots to a collection"
  on public.collection_spots for insert
  with check (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can reorder collection spots"
  on public.collection_spots for update
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "Admins can remove spots from a collection"
  on public.collection_spots for delete
  using (
    exists (select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin')
  );
