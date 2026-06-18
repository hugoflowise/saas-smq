-- ============================================================================
-- Module 6 — Conformité ISO 9001 (CDC §5.2, §9 Module 6)
-- ============================================================================

create type public.domaine_iso as enum (
  'contexte', 'leadership', 'planification', 'support',
  'realisation', 'evaluation', 'amelioration'
);
create type public.cotation_conformite as enum (
  'non_evalue', 'conforme', 'point_fort', 'point_attention',
  'nc_mineure', 'nc_majeure', 'non_applicable'
);

-- Référentiel ISO 9001:2015 — table GLOBALE (pas de tenant_id)
create table public.referentiel_iso (
  id uuid primary key default gen_random_uuid(),
  norme text not null default 'ISO 9001',
  version text not null default '2015',
  chapitre text not null,
  intitule text not null,
  description text,
  exigences jsonb,
  preuves_attendues text,
  domaine public.domaine_iso not null,
  est_obligatoire boolean not null default true,
  ordre_affichage integer not null default 0
);

create unique index idx_referentiel_iso_chapitre
  on public.referentiel_iso (norme, version, chapitre);

-- Auto-évaluation par chapitre et par tenant
create table public.conformite_evaluation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  referentiel_iso_id uuid not null references public.referentiel_iso (id) on delete cascade,
  cotation public.cotation_conformite not null default 'non_evalue',
  preuves_liees jsonb,
  commentaire text,
  date_evaluation date,
  evaluateur_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, referentiel_iso_id)
);

create trigger trg_conformite_updated_at
  before update on public.conformite_evaluation
  for each row execute function public.set_updated_at();

-- RLS
alter table public.referentiel_iso enable row level security;
alter table public.conformite_evaluation enable row level security;

-- Référentiel : lecture pour tout utilisateur authentifié (réf. globale)
create policy referentiel_iso_select on public.referentiel_iso
  for select to authenticated using (true);

create policy conformite_select on public.conformite_evaluation
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy conformite_insert on public.conformite_evaluation
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy conformite_update on public.conformite_evaluation
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
