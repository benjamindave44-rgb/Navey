-- Flag column: set when an owner's edit trips the automated content-
-- guideline check, so admins can review it without taking the listing
-- offline while it's checked.
alter table public.spots add column needs_review boolean not null default false;

-- Submitters can edit their own spot regardless of its current status
-- (previously only allowed while still pending, which blocked owners
-- from ever updating a spot once it was approved).
create policy "Submitters can edit their own spot anytime"
  on public.spots for update
  using (submitted_by = auth.uid());

-- Submitters can remove tags from their own spot (only inserting was
-- previously possible).
create policy "Submitters can remove tags from their own spot"
  on public.spot_tags for delete
  using (
    spot_id in (select id from public.spots where submitted_by = auth.uid())
  );

-- Submitters can update/replace hours for their own spot (only
-- inserting was previously possible).
create policy "Submitters can update hours for their own spot"
  on public.spot_hours for update
  using (
    spot_id in (select id from public.spots where submitted_by = auth.uid())
  );

create policy "Submitters can delete hours for their own spot"
  on public.spot_hours for delete
  using (
    spot_id in (select id from public.spots where submitted_by = auth.uid())
  );
