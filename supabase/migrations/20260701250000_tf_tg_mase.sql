-- ============================================================================
-- MASE Axe 4/5 : taux de fréquence (TF) et de gravité (TG) des accidents
--
-- Indicateurs de résultat SSE, signature MASE :
--   TF = (accidents avec arrêt x 1 000 000) / heures travaillées
--   TG = (journées d'arrêt x 1 000)        / heures travaillées
-- On complète les remontées (accident avec arrêt + jours d'arrêt) et on ajoute
-- les heures travaillées par année (dénominateur des taux).
-- ============================================================================

alter table public.reclamations
  add column if not exists avec_arret boolean not null default false,
  add column if not exists jours_arret integer check (jours_arret >= 0);

create table public.heures_travaillees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  annee integer not null,
  heures numeric not null check (heures >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  unique (tenant_id, annee)
);

create trigger trg_heures_travaillees_updated_at
  before update on public.heures_travaillees
  for each row execute function public.set_updated_at();

alter table public.heures_travaillees enable row level security;

create policy heures_select on public.heures_travaillees
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy heures_insert on public.heures_travaillees
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy heures_update on public.heures_travaillees
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
