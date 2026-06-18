-- ============================================================================
-- Module 13 — Parties intéressées + Contexte (CDC §5.2)
-- ============================================================================

create type public.pi_type as enum (
  'client', 'fournisseur', 'collaborateur', 'autorite', 'actionnaire', 'autre'
);
create type public.pi_influence as enum ('faible', 'moyen', 'fort');

create table public.parties_interessees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nom text not null,
  type public.pi_type not null default 'autre',
  attentes text,
  exigences text,
  niveau_influence public.pi_influence not null default 'moyen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_pi_tenant on public.parties_interessees (tenant_id);

create trigger trg_pi_updated_at
  before update on public.parties_interessees
  for each row execute function public.set_updated_at();

create table public.contexte_organisme (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants (id) on delete cascade,
  analyse_swot jsonb,
  analyse_pestel jsonb,
  date_revue date,
  prochain_revue date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger trg_contexte_updated_at
  before update on public.contexte_organisme
  for each row execute function public.set_updated_at();

-- RLS
alter table public.parties_interessees enable row level security;
alter table public.contexte_organisme enable row level security;

create policy pi_select on public.parties_interessees
  for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy pi_insert on public.parties_interessees
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy pi_update on public.parties_interessees
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy contexte_select on public.contexte_organisme
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy contexte_insert on public.contexte_organisme
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy contexte_update on public.contexte_organisme
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
