-- ============================================================================
-- MASE Axe 4 : registre des contrôles réglementaires obligatoires
--
-- Vérifications périodiques imposées (levage, électrique, incendie, ATEX,
-- machines, bruit…) : équipement, organisme, périodicité et échéances, avec
-- suivi de la conformité. Brique propre au SSE (gatée MASE/45001), distincte de
-- la veille réglementaire (le « quoi surveiller ») : ici on suit le « quand
-- refaire tel contrôle ».
-- ============================================================================

create type public.controle_statut as enum ('a_planifier', 'conforme', 'non_conforme');

create table public.controles_obligatoires (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  intitule text not null,
  equipement text,
  organisme text,
  domaine text check (domaine in ('securite', 'sante', 'environnement')),
  periodicite_mois integer check (periodicite_mois > 0),
  date_dernier date,
  date_prochain date,
  statut public.controle_statut not null default 'a_planifier',
  reference text,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_controles_tenant on public.controles_obligatoires (tenant_id, date_prochain);

create trigger trg_controles_updated_at
  before update on public.controles_obligatoires
  for each row execute function public.set_updated_at();

alter table public.controles_obligatoires enable row level security;

create policy controles_select on public.controles_obligatoires
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );
create policy controles_insert on public.controles_obligatoires
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy controles_update on public.controles_obligatoires
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
