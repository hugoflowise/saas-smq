-- ============================================================================
-- Historique des (ré)évaluations fournisseurs (ISO 9001 §8.4.1 — surveillance
-- et réévaluation périodique des prestataires externes)
--
-- La table `fournisseurs` ne conserve que la dernière note/date d'évaluation
-- (écrasée à chaque mise à jour). Pour prouver à l'auditeur la surveillance
-- périodique, on conserve ici l'HISTORIQUE daté de chaque réévaluation, avec
-- les notes par critère (jsonb). Les critères par défaut sont définis côté code
-- (`src/lib/fournisseurs-criteres.ts`) : qualité, délai, prix, réactivité,
-- conformité documentaire.
-- ============================================================================

create table public.fournisseur_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  fournisseur_id uuid not null references public.fournisseurs (id) on delete cascade,
  date_evaluation date not null,
  note_globale integer check (note_globale between 1 and 5),
  notes_criteres jsonb not null default '{}'::jsonb,
  commentaire text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_fournisseur_evaluations_tenant
  on public.fournisseur_evaluations (tenant_id, fournisseur_id, date_evaluation desc);

alter table public.fournisseur_evaluations enable row level security;

create policy fournisseur_evaluations_select on public.fournisseur_evaluations for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy fournisseur_evaluations_insert on public.fournisseur_evaluations for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy fournisseur_evaluations_update on public.fournisseur_evaluations for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy fournisseur_evaluations_delete on public.fournisseur_evaluations for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
