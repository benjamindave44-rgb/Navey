-- Storage bucket for spot and review photos (collection photos deferred to admin tooling).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Photos are publicly readable"
on storage.objects for select
using (bucket_id = 'photos');

-- Spot photos live at spots/{spotId}/{gallery|menu}/{file}; only the spot's submitter may write.
create policy "Spot owners can upload spot photos"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = 'spots'
  and exists (
    select 1 from public.spots
    where spots.id::text = (storage.foldername(name))[2]
    and spots.submitted_by = auth.uid()
  )
);

create policy "Spot owners can remove spot photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = 'spots'
  and exists (
    select 1 from public.spots
    where spots.id::text = (storage.foldername(name))[2]
    and spots.submitted_by = auth.uid()
  )
);

-- Review photos live at reviews/{reviewId}/{file}; only the review's author may write.
create policy "Reviewers can upload review photos"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = 'reviews'
  and exists (
    select 1 from public.reviews
    where reviews.id::text = (storage.foldername(name))[2]
    and reviews.user_id = auth.uid()
  )
);

create policy "Reviewers can remove review photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = 'reviews'
  and exists (
    select 1 from public.reviews
    where reviews.id::text = (storage.foldername(name))[2]
    and reviews.user_id = auth.uid()
  )
);

-- Allow deleting the DB rows to match storage deletes (previously insert-only).
create policy "Submitters can remove their own spot photos"
on public.spot_photos for delete
using (
  spot_id in (select id from public.spots where submitted_by = auth.uid())
);

create policy "Users can remove photos from their own review"
on public.review_photos for delete
using (
  review_id in (select id from public.reviews where user_id = auth.uid())
);
