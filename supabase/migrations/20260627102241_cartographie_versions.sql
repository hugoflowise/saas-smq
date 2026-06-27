-- ============================================================================
-- Historique des versions figées de la CARTOGRAPHIE DES PROCESSUS.
--
-- La cartographie est une vue dérivée des processus : elle n'a pas de contenu
-- propre. Pour disposer d'une « version » + « date de mise à jour » + historique
-- (comme les autres documents), on fige à la demande un instantané de la carte
-- (familles + processus). Table append-only en lecture seule : une version par
-- publication, jamais modifiée (même modèle que processus_fiche_versions).
--
-- Version courante = la ligne la plus récente du tenant (created_at max).
-- ============================================================================

create table public.cartographie_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  version text not null,
  -- { charte: text|null, processus: [{ nom, type, description }] }
  snapshot jsonb,
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_cartographie_versions on public.cartographie_versions (tenant_id, created_at);

alter table public.cartographie_versions enable row level security;

create policy cartographie_versions_select on public.cartographie_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy cartographie_versions_insert on public.cartographie_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
