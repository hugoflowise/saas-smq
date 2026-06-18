-- ============================================================================
-- Modules 10 (Audits internes) & 11 (Revues de direction)
-- ============================================================================

create type public.audit_statut as enum (
  'planifie', 'en_cours', 'realise', 'rapport_redige', 'cloture'
);
create type public.revue_statut as enum ('planifiee', 'realisee', 'cloturee');

create table public.audits_internes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reference text not null,
  perimetre text,
  processus_audites uuid[],
  auditeur_id uuid references public.profiles (id) on delete set null,
  date_prevue date,
  date_realisee date,
  duree_prevue numeric,
  statut public.audit_statut not null default 'planifie',
  rapport text,
  ecarts_constates text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_audits_tenant on public.audits_internes (tenant_id, statut);
create trigger trg_audits_updated_at before update on public.audits_internes
  for each row execute function public.set_updated_at();

create table public.revues_direction (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  annee integer not null,
  date_realisation date,
  ordre_du_jour text,
  conclusions text,
  decisions text,
  statut public.revue_statut not null default 'planifiee',
  approuve_par uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_revues_tenant on public.revues_direction (tenant_id, annee desc);
create trigger trg_revues_updated_at before update on public.revues_direction
  for each row execute function public.set_updated_at();

-- RLS
alter table public.audits_internes enable row level security;
alter table public.revues_direction enable row level security;

create policy audits_select on public.audits_internes for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy audits_insert on public.audits_internes for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy audits_update on public.audits_internes for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy revues_select on public.revues_direction for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy revues_insert on public.revues_direction for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy revues_update on public.revues_direction for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
