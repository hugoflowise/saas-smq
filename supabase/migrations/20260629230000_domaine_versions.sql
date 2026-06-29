-- ============================================================================
-- Domaine d'application (§4.3) : versions figées + historique, sur le modèle du
-- contexte (contexte_versions). snapshot = { perimetre, sites, exclusions,
-- dateEtablissement, prochaineRevue, valideLe, validateur }.
-- ============================================================================

create table public.domaine_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  version text not null,
  snapshot jsonb,
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_domaine_versions on public.domaine_versions (tenant_id, created_at);

alter table public.domaine_versions enable row level security;

create policy domaine_versions_select on public.domaine_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy domaine_versions_insert on public.domaine_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
-- DELETE indispensable : sans cette policy, RLS refuse la suppression en silence.
create policy domaine_versions_delete on public.domaine_versions
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
