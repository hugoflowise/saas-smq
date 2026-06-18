-- ============================================================================
-- Module 7 — Indicateurs / KPI (CDC §5.2, §9 Module 7)
-- ============================================================================

create type public.indicateur_type as enum ('numeric', 'percentage', 'count', 'duration');
create type public.indicateur_frequence as enum (
  'quotidien', 'hebdo', 'mensuel', 'trimestriel', 'annuel'
);
create type public.indicateur_source as enum ('manuel', 'boondmanager', 'calcul');

create table public.indicateurs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nom text not null,
  description text,
  processus_id uuid references public.processus (id) on delete set null,
  type public.indicateur_type not null default 'numeric',
  unite text,
  cible numeric,
  seuil_alerte_min numeric,
  seuil_alerte_max numeric,
  frequence_mesure public.indicateur_frequence not null default 'mensuel',
  source public.indicateur_source not null default 'manuel',
  formule_calcul text,
  boond_endpoint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_indicateurs_tenant on public.indicateurs (tenant_id, processus_id);

create trigger trg_indicateurs_updated_at
  before update on public.indicateurs
  for each row execute function public.set_updated_at();

create table public.indicateurs_valeurs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  indicateur_id uuid not null references public.indicateurs (id) on delete cascade,
  valeur numeric not null,
  date_mesure date not null default current_date,
  commentaire text,
  source_donnees jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index idx_indicateurs_valeurs on public.indicateurs_valeurs (indicateur_id, date_mesure);

-- RLS
alter table public.indicateurs enable row level security;
alter table public.indicateurs_valeurs enable row level security;

create policy indicateurs_select on public.indicateurs
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );
create policy indicateurs_insert on public.indicateurs
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy indicateurs_update on public.indicateurs
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy indicateurs_valeurs_select on public.indicateurs_valeurs
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy indicateurs_valeurs_insert on public.indicateurs_valeurs
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
