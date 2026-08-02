-- check_rate_limit has to be callable by anon, because that is the role the
-- app itself uses. That makes it reachable over the API, so it cannot trust
-- its arguments: an unbounded window, limit or bucket string turns a rate
-- limiter into a general-purpose row writer.
--
-- It also only ever swept the bucket it was called with. Buckets are keyed per
-- person, so every address that visits once and never returns left its rows
-- behind permanently.

create index if not exists rate_limit_hits_created_at_idx
  on public.rate_limit_hits (created_at);

create or replace function public.check_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  used integer;
  bucket_key text;
  window_capped interval;
  limit_capped integer;
begin
  bucket_key := left(coalesce(p_bucket, ''), 200);
  if bucket_key = '' then
    return true;
  end if;

  window_capped := least(
    greatest(coalesce(p_window, interval '1 hour'), interval '1 second'),
    interval '1 day'
  );
  limit_capped := least(greatest(coalesce(p_limit, 10), 1), 1000);

  delete from public.rate_limit_hits
  where bucket = bucket_key and created_at < now() - window_capped;

  -- Occasional global sweep, so abandoned buckets cannot accumulate. Runs on
  -- roughly one call in a hundred rather than every call, which keeps the
  -- common path a single-bucket operation.
  if random() < 0.01 then
    delete from public.rate_limit_hits
    where created_at < now() - interval '1 day';
  end if;

  select count(*) into used
  from public.rate_limit_hits
  where bucket = bucket_key and created_at >= now() - window_capped;

  if used >= limit_capped then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (bucket_key);
  return true;
end;
$function$;
