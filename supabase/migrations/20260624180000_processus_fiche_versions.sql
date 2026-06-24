-- ============================================================================
-- Historique des versions figées de la fiche d'identité de processus, sur le
-- même modèle que politique_qualite_versions / procedures_versions : à chaque
-- publication, un instantané complet de la fiche est conservé (lecture seule).
-- ============================================================================

create table public.processus_fiche_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  processus_id uuid not null references public.processus (id) on delete cascade,
  version text not null,
  snapshot jsonb,
  redige_par uuid references public.profiles (id) on delete set null,
  soumis_par uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  signature_data jsonb,
  created_at timestamptz not null default now()
);

create index idx_processus_fiche_versions on public.processus_fiche_versions (processus_id, created_at);

alter table public.processus_fiche_versions enable row level security;

create policy processus_fiche_versions_select on public.processus_fiche_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy processus_fiche_versions_insert on public.processus_fiche_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
