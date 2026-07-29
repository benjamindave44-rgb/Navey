-- Every policy called auth.uid() bare, which Postgres re-evaluates for each
-- row scanned rather than once per query. On a listing page that is the
-- difference between one call and one per row returned.
--
-- Rewritten mechanically from the catalogue so each expression is preserved
-- character for character apart from the substitution -- retyping 46 policies
-- by hand is how a security hole gets introduced. The whole thing runs in one
-- transaction: either every policy is replaced or none is.
do $$
declare
  p record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for p in
    select tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
      and coalesce(qual, '') not like '%SELECT auth.uid()%'
      and coalesce(with_check, '') not like '%SELECT auth.uid()%'
  loop
    new_qual := replace(coalesce(p.qual, ''), 'auth.uid()', '(select auth.uid())');
    new_check := replace(coalesce(p.with_check, ''), 'auth.uid()', '(select auth.uid())');

    execute format('drop policy %I on public.%I', p.policyname, p.tablename);

    stmt := format(
      'create policy %I on public.%I as %s for %s to %s',
      p.policyname,
      p.tablename,
      case when p.permissive = 'PERMISSIVE' then 'permissive' else 'restrictive' end,
      p.cmd,
      array_to_string(p.roles, ', ')
    );
    if p.qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if p.with_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;

    execute stmt;
  end loop;
end $$;
