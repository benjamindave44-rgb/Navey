-- Every foreign key was unindexed, so each join scanned the whole child
-- table. Invisible at ten spots, ruinous at ten thousand -- and these are the
-- joins the site makes on every page: a spot to its photos, tags and hours.
create index if not exists spot_photos_spot_id_idx on public.spot_photos (spot_id);
create index if not exists spot_tags_spot_id_idx on public.spot_tags (spot_id);
create index if not exists spot_tags_tag_id_idx on public.spot_tags (tag_id);
create index if not exists spot_hours_spot_id_idx on public.spot_hours (spot_id);
create index if not exists spots_submitted_by_idx on public.spots (submitted_by);
create index if not exists reviews_spot_id_idx on public.reviews (spot_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists review_photos_review_id_idx on public.review_photos (review_id);
create index if not exists review_reports_reporter_id_idx on public.review_reports (reporter_id);
create index if not exists saved_lists_user_id_idx on public.saved_lists (user_id);
create index if not exists saved_list_spots_spot_id_idx on public.saved_list_spots (spot_id);
create index if not exists saved_list_spots_list_id_idx on public.saved_list_spots (list_id);
create index if not exists collection_spots_collection_id_idx on public.collection_spots (collection_id);
create index if not exists collection_spots_spot_id_idx on public.collection_spots (spot_id);
create index if not exists collection_photos_collection_id_idx on public.collection_photos (collection_id);
create index if not exists collections_curator_id_idx on public.collections (curator_id);
create index if not exists business_claims_spot_id_idx on public.business_claims (spot_id);
create index if not exists business_claims_claimant_id_idx on public.business_claims (claimant_id);
create index if not exists business_claims_reviewed_by_idx on public.business_claims (reviewed_by);

-- The public list is always "approved, newest first"; this serves it directly.
create index if not exists spots_status_created_idx
  on public.spots (status, created_at desc);
