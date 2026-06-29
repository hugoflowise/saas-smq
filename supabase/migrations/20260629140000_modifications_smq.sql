-- ============================================================================
-- Planification des modifications du SMQ (ISO 9001 §6.3)
-- Registre léger des modifications planifiées du système de management de la
-- qualité : objet/finalité, conséquences potentielles (intégrité du SMQ),
-- ressources, responsabilités, échéances et statut de réalisation.
-- Modèle calqué sur la table fournisseurs (CRUD tenant + soft-delete).
-- ============================================================================

create type public.modification_smq_statut as enum (
  'planifiee',
  'en_cours',
  'realisee',
  'abandonnee'
);

create table public.modifications_smq (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  objet text not null,
  -- finalité / raison de la modification (« pourquoi »)
  finalite text,
  -- conséquences potentielles / impact sur l'intégrité du SMQ
  consequences text,
  -- ressources nécessaires (humaines, matérielles, budgétaires)
  ressources text,
  responsable_id uuid references public.profiles (id) on delete set null,
  date_prevue date,
  date_realisee date,
  statut public.modification_smq_statut not null default 'planifiee',
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_modifications_smq_tenant on public.modifications_smq (tenant_id, statut);
create trigger trg_modifications_smq_updated_at before update on public.modifications_smq
  for each row execute function public.set_updated_at();

alter table public.modifications_smq enable row level security;

create policy modifications_smq_select on public.modifications_smq for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy modifications_smq_insert on public.modifications_smq for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy modifications_smq_update on public.modifications_smq for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy modifications_smq_delete on public.modifications_smq for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
