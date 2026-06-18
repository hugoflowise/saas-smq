-- ============================================================================
-- Modules 17 (Réclamations), 16 (Veille), 3 (Objectifs qualité)
-- ============================================================================

create type public.reclamation_canal as enum ('mail', 'tel', 'visio', 'audit', 'enquete', 'autre');
create type public.reclamation_statut as enum ('recue', 'analysee', 'traitee', 'cloturee');
create type public.veille_domaine as enum (
  'travail', 'qualite', 'environnement', 'securite', 'rgpd', 'autre'
);
create type public.veille_statut as enum ('a_analyser', 'analysee', 'integree', 'sans_objet');
create type public.objectif_statut as enum ('actif', 'atteint', 'abandonne');

-- Réclamations (Module 17)
create table public.reclamations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  objet text not null,
  client text,
  date_reception date not null default current_date,
  canal public.reclamation_canal not null default 'mail',
  description text,
  gravite public.nc_gravite not null default 'mineure',
  nc_associee uuid references public.non_conformites (id) on delete set null,
  traitement text,
  date_reponse date,
  satisfait_client boolean,
  statut public.reclamation_statut not null default 'recue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_reclamations_tenant on public.reclamations (tenant_id, statut);
create trigger trg_reclamations_updated_at before update on public.reclamations
  for each row execute function public.set_updated_at();

-- Veille réglementaire (Module 16)
create table public.veille_reglementaire (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reference text,
  intitule text not null,
  domaine public.veille_domaine not null default 'qualite',
  date_publication date,
  date_application date,
  impact_smq text,
  actions_a_prevoir text,
  statut public.veille_statut not null default 'a_analyser',
  responsable_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_veille_tenant on public.veille_reglementaire (tenant_id, statut);
create trigger trg_veille_updated_at before update on public.veille_reglementaire
  for each row execute function public.set_updated_at();

-- Objectifs qualité (Module 3)
create table public.objectifs_qualite (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  intitule text not null,
  description text,
  est_smart boolean not null default false,
  cible_chiffree text,
  echeance date,
  responsable_id uuid references public.profiles (id) on delete set null,
  fonction_concernee text,
  statut public.objectif_statut not null default 'actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_objectifs_tenant on public.objectifs_qualite (tenant_id, statut);
create trigger trg_objectifs_updated_at before update on public.objectifs_qualite
  for each row execute function public.set_updated_at();

-- RLS (motif commun : isolation tenant + admin Flowise)
alter table public.reclamations enable row level security;
alter table public.veille_reglementaire enable row level security;
alter table public.objectifs_qualite enable row level security;

create policy reclamations_select on public.reclamations for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy reclamations_insert on public.reclamations for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy reclamations_update on public.reclamations for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy veille_select on public.veille_reglementaire for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy veille_insert on public.veille_reglementaire for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy veille_update on public.veille_reglementaire for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy objectifs_select on public.objectifs_qualite for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy objectifs_insert on public.objectifs_qualite for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy objectifs_update on public.objectifs_qualite for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
