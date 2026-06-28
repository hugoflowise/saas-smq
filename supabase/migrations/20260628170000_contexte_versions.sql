-- ============================================================================
-- Analyse de contexte (SWOT/PESTEL) : référence documentaire + versions figées
-- + historique, sur le modèle léger de la cartographie des processus.
-- Référence par défaut DG_SMQ_003 (document de management réservé), modifiable.
-- ============================================================================

-- Référence : le DEFAULT remplit aussi les lignes existantes.
alter table public.contexte_organisme
  add column reference text default 'DG_SMQ_003';

-- Historique des versions figées (append-only). snapshot = { reference, swot,
-- pestel, dateRevue, prochainRevue }.
create table public.contexte_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  version text not null,
  snapshot jsonb,
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_contexte_versions on public.contexte_versions (tenant_id, created_at);

alter table public.contexte_versions enable row level security;

create policy contexte_versions_select on public.contexte_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy contexte_versions_insert on public.contexte_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
-- DELETE indispensable : sans cette policy, RLS refuse la suppression en silence.
create policy contexte_versions_delete on public.contexte_versions
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
