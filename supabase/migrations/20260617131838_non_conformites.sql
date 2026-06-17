-- ============================================================================
-- Module 9 — Non-conformités (CDC §5.2, §9 Module 9)
-- ============================================================================

create type public.nc_origine as enum (
  'audit_interne', 'audit_externe', 'client', 'collaborateur', 'rdd', 'autre'
);
create type public.nc_gravite as enum ('mineure', 'majeure', 'critique');
create type public.nc_type as enum ('nc_produit', 'nc_processus', 'reclamation_client');
create type public.nc_statut as enum (
  'ouverte', 'analysee', 'action_definie', 'cloturee', 'efficace', 'inefficace'
);

create table public.non_conformites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reference text not null,
  intitule text not null,
  description text,
  date_constat date not null default current_date,
  origine public.nc_origine not null default 'autre',
  origine_detail text,
  processus_concerne uuid references public.processus (id) on delete set null,
  gravite public.nc_gravite not null default 'mineure',
  type public.nc_type not null default 'nc_processus',
  causes_identifiees jsonb,
  responsable_traitement uuid references public.profiles (id) on delete set null,
  statut public.nc_statut not null default 'ouverte',
  date_cloture date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_nc_tenant on public.non_conformites (tenant_id, statut, gravite);

create trigger trg_nc_updated_at
  before update on public.non_conformites
  for each row execute function public.set_updated_at();

-- Lien NC -> actions correctives (plusieurs actions par NC)
create table public.nc_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nc_id uuid not null references public.non_conformites (id) on delete cascade,
  action_id uuid not null references public.actions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (nc_id, action_id)
);

create index idx_nc_actions_nc on public.nc_actions (nc_id);

-- RLS
alter table public.non_conformites enable row level security;
alter table public.nc_actions enable row level security;

create policy nc_select on public.non_conformites
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );
create policy nc_insert on public.non_conformites
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy nc_update on public.non_conformites
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy nc_actions_select on public.nc_actions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy nc_actions_insert on public.nc_actions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy nc_actions_delete on public.nc_actions
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
