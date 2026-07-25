create table public.business_claims (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  claimant_id uuid not null references public.profiles (id) on delete cascade,
  claimant_name text not null,
  claimant_email text not null,
  proof_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

alter table public.business_claims enable row level security;

-- Only one open claim per person per spot at a time.
create unique index business_claims_pending_unique
  on public.business_claims (spot_id, claimant_id)
  where status = 'pending';

create policy "Claimants can view their own claims"
  on public.business_claims for select
  using (claimant_id = auth.uid());

create policy "Admins can view all claims"
  on public.business_claims for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Authenticated users can submit a claim"
  on public.business_claims for insert
  to authenticated
  with check (claimant_id = auth.uid());

create policy "Claimants can attach proof to their own pending claim"
  on public.business_claims for update
  using (claimant_id = auth.uid() and status = 'pending')
  with check (claimant_id = auth.uid());

create policy "Admins can review any claim"
  on public.business_claims for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Private bucket: proof-of-ownership documents are sensitive and must
-- not be publicly readable like the "photos" bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('claim-proofs', 'claim-proofs', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

create policy "Claimants can upload their own claim proof"
on storage.objects for insert
with check (
  bucket_id = 'claim-proofs'
  and (storage.foldername(name))[1] = 'claims'
  and exists (
    select 1 from public.business_claims
    where business_claims.id::text = (storage.foldername(name))[2]
    and business_claims.claimant_id = auth.uid()
  )
);

create policy "Claimants and admins can view claim proof"
on storage.objects for select
using (
  bucket_id = 'claim-proofs'
  and (storage.foldername(name))[1] = 'claims'
  and (
    exists (
      select 1 from public.business_claims
      where business_claims.id::text = (storage.foldername(name))[2]
      and business_claims.claimant_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
);
