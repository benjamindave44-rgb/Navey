-- The admin UI exposes a permanent delete, but spots had no delete policy at
-- all. With RLS enabled that silently removes nothing: Postgres filters the
-- row out, the statement succeeds, and the caller sees success while the
-- listing stays live. Grant the capability the UI already offers.
create policy "Admins can delete any spot"
  on public.spots for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
