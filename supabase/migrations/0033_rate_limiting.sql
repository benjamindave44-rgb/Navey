-- Nothing capped how often a public action could be repeated, so a script
-- could flood the review queue with listings or the mailing list with fake
-- addresses. The damage isn't a breach, it's junk -- and cleaning it up by
-- hand afterwards is far more work than refusing it now.
--
-- Kept in the database rather than in memory: the app runs across several
-- serverless instances, so a counter held in one process would be invisible
-- to the others and reset on every cold start.
create table public.rate_limit_hits (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_idx
  on public.rate_limit_hits (bucket, created_at desc);

alter table public.rate_limit_hits enable row level security;
-- Deliberately no policies: only the definer function below touches this,
-- so nobody can read others' activity or forge their way past a limit.

/**
 * Returns true when the action is allowed, and records it. Returns false
 * when the caller has already used the allowance for the window.
 *
 * Old rows for the bucket are cleared on the way through, so the table
 * stays small without needing a scheduled job.
 */
create or replace function public.check_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  delete from public.rate_limit_hits
  where bucket = p_bucket and created_at < now() - p_window;

  select count(*) into used
  from public.rate_limit_hits
  where bucket = p_bucket and created_at >= now() - p_window;

  if used >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, interval) from public;
grant execute on function public.check_rate_limit(text, integer, interval) to anon, authenticated;
