-- ============================================================================
-- MASE Axe 3 : Analyse de risques (AdR) par mission + Plan de prévention (PDP)
--
-- Cœur métier MASE (aucun équivalent 9001) : 1 mission = 1 analyse de risques,
-- signée et tenue à jour, listant les situations de travail (phases) et, pour
-- chacune, les dangers par domaine S/S/E, leur cotation et les mesures de
-- prévention. Le plan de prévention co-signé avec l'entreprise utilisatrice est
-- une donnée d'entrée de l'AdR (référencée ici, il ne la remplace pas).
-- ============================================================================

create type public.adr_statut as enum ('brouillon', 'validee', 'a_reviser', 'archivee');
create type public.adr_domaine as enum ('securite', 'sante', 'environnement');

-- En-tête : une analyse de risques par mission / intervention.
create table public.analyses_risques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  intitule text not null,
  -- Mission / site / client concerné (lien Boond ultérieur : texte pour l'instant).
  mission text,
  lieu text,
  date_analyse date,
  date_revision date,
  statut public.adr_statut not null default 'brouillon',
  -- Plan de prévention (obligatoire pour certaines interventions sur site client).
  pdp_requis boolean not null default false,
  pdp_reference text,
  pdp_date_signature date,
  notes text,
  valide_par uuid references public.profiles (id) on delete set null,
  valide_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_adr_tenant on public.analyses_risques (tenant_id, statut, date_revision);

create trigger trg_adr_updated_at
  before update on public.analyses_risques
  for each row execute function public.set_updated_at();

alter table public.analyses_risques enable row level security;

create policy adr_select on public.analyses_risques
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );
create policy adr_insert on public.analyses_risques
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy adr_update on public.analyses_risques
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Lignes : situations de travail (phases) d'une analyse et leur cotation.
create table public.analyses_risques_lignes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  analyse_id uuid not null references public.analyses_risques (id) on delete cascade,
  ordre integer not null default 0,
  tache text not null,
  domaine public.adr_domaine not null default 'securite',
  danger text,
  gravite integer not null default 1 check (gravite between 1 and 4),
  probabilite integer not null default 1 check (probabilite between 1 and 4),
  criticite integer generated always as (gravite * probabilite) stored,
  mesures_prevention text,
  risque_residuel text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create index idx_adr_lignes_analyse on public.analyses_risques_lignes (analyse_id, ordre);

create trigger trg_adr_lignes_updated_at
  before update on public.analyses_risques_lignes
  for each row execute function public.set_updated_at();

alter table public.analyses_risques_lignes enable row level security;

create policy adr_lignes_select on public.analyses_risques_lignes
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy adr_lignes_insert on public.analyses_risques_lignes
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy adr_lignes_update on public.analyses_risques_lignes
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy adr_lignes_delete on public.analyses_risques_lignes
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
