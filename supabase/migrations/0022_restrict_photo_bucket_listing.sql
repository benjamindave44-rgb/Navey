-- The photos bucket is public, so objects are served over /object/public/
-- URLs without consulting RLS at all. The broad SELECT policy therefore
-- added no access the site needs -- it only let anyone call the storage API
-- and enumerate every file ever uploaded, including photos on spots that are
-- still pending or rejected.
--
-- Nothing in the app calls list() or download(); photo URLs come from
-- getPublicUrl, and claim proofs live in a separate private bucket with its
-- own policy. Dropping this leaves image loading untouched.
drop policy if exists "Photos are publicly readable" on storage.objects;
