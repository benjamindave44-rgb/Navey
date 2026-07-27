-- prevent_self_role_escalation() is a trigger function, but being in the
-- public schema it was also exposed as an RPC endpoint any visitor could
-- call. Calling it outside a trigger fails anyway, so nothing legitimate
-- needs this grant -- it is only attack surface.
revoke execute on function public.prevent_self_role_escalation() from public, anon, authenticated;
