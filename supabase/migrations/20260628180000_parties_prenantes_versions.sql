-- ============================================================================
-- Cartographie des parties prenantes : référence documentaire + versions figées
-- + historique, sur le modèle léger de la cartographie des processus (la liste
-- des parties intéressées est figée en instantané à la publication).
-- Référence par défaut DG_SMQ_005 (document de management réservé), modifiable.
-- La référence vit sur le tenant (la cartographie est une vue dérivée, sans
-- table maître), comme cartographie_reference.
-- ============================================================================

alter table public.tenants
  add column parties_prenantes_reference text default 'DG_SMQ_005';

create table public.parties_prenantes_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  version text not null,
  -- { reference, societe, parties: [{ nom, sphere, type, interaction, pouvoir,
  --   legitimite, urgence, total, priorite, nbAttentes }] }
  snapshot jsonb,
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_parties_prenantes_versions
  on public.parties_prenantes_versions (tenant_id, created_at);

alter table public.parties_prenantes_versions enable row level security;

create policy parties_prenantes_versions_select on public.parties_prenantes_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy parties_prenantes_versions_insert on public.parties_prenantes_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
-- DELETE indispensable : sans cette policy, RLS refuse la suppression en silence.
create policy parties_prenantes_versions_delete on public.parties_prenantes_versions
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
