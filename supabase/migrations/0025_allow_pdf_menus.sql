-- Many shops publish their menu as a PDF rather than photos of a board.
-- PDFs aren't compressed client-side the way photos are, so the ceiling
-- moves up to suit them; images are still capped lower in application code.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'],
    file_size_limit = 10485760
where id = 'photos';
