-- 0015 wrote these policies as storage.foldername(spots.name). Inside the
-- subquery `name` binds to spots.name -- the shop's title -- not to the
-- storage object path, so the check compared a spot's id against a fragment
-- of its own name and never matched. Every spot photo upload failed with a
-- 400 no matter who owned the spot. The review policies were unaffected
-- because reviews has no name column for `name` to bind to.
--
-- Qualify the column explicitly so the intent can't be shadowed again.
drop policy if exists "Spot owners can upload spot photos" on storage.objects;
drop policy if exists "Spot owners can remove spot photos" on storage.objects;

create policy "Spot owners can upload spot photos"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and (storage.foldername(objects.name))[1] = 'spots'
  and exists (
    select 1 from public.spots
    where spots.id::text = (storage.foldername(objects.name))[2]
    and spots.submitted_by = auth.uid()
  )
);

create policy "Spot owners can remove spot photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and (storage.foldername(objects.name))[1] = 'spots'
  and exists (
    select 1 from public.spots
    where spots.id::text = (storage.foldername(objects.name))[2]
    and spots.submitted_by = auth.uid()
  )
);
