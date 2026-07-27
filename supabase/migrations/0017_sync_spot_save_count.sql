-- spots.save_count was a plain column nothing ever wrote to, so "most saved"
-- sorting and the leaderboard's save points had nothing behind them. Keep it
-- in step with saved_list_spots instead of trusting callers to update it.
--
-- security definer because the person saving a spot has no update rights on
-- someone else's listing.
create or replace function public.sync_spot_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.spot_id, old.spot_id);
begin
  update public.spots
  set save_count = (
    select count(*) from public.saved_list_spots where spot_id = target
  )
  where id = target;
  return null;
end;
$$;

revoke execute on function public.sync_spot_save_count() from public, anon, authenticated;

drop trigger if exists saved_list_spots_sync_save_count on public.saved_list_spots;

create trigger saved_list_spots_sync_save_count
after insert or delete on public.saved_list_spots
for each row execute function public.sync_spot_save_count();

-- Backfill so existing rows aren't stuck at whatever was seeded.
update public.spots s
set save_count = coalesce(counts.total, 0)
from (
  select id, (
    select count(*) from public.saved_list_spots sls where sls.spot_id = spots.id
  ) as total
  from public.spots
) as counts
where counts.id = s.id;
