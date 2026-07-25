-- Admins can see all saved-list-spot rows for accurate aggregate
-- analytics (counts only, in the admin dashboard — this does not
-- expose this data anywhere public-facing).
create policy "Admins can view all saved list spots"
  on public.saved_list_spots for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
