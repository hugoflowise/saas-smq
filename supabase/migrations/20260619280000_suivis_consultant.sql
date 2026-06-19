-- ============================================================================
-- Suivi consultant (formulaire terrain, sans connexion) — QSSE / écoute interne
-- Réponses complètes en JSONB + champs clés dénormalisés pour les KPIs.
-- ============================================================================

create table public.suivis_consultant (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  -- Identification (dénormalisé)
  nom text,
  email text,
  client text,
  poste text,
  site_intervention text,
  -- KPIs (dénormalisés)
  satisfaction_globale integer check (satisfaction_globale between 1 and 5),
  note_qualite_suivi_manager integer check (note_qualite_suivi_manager between 1 and 5),
  nps integer check (nps between 0 and 10),
  coherence_odm boolean,
  secteur_nucleaire boolean,
  besoin_accompagnement boolean,
  habilitations boolean,
  -- Alerte santé / RPS (harcèlement, stress, conflit)
  alerte boolean not null default false,
  -- Réponses complètes du formulaire
  reponses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_suivis_consultant_tenant on public.suivis_consultant (tenant_id, created_at desc);
create trigger trg_suivis_consultant_updated_at before update on public.suivis_consultant
  for each row execute function public.set_updated_at();

alter table public.suivis_consultant enable row level security;

create policy suivis_consultant_select on public.suivis_consultant for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy suivis_consultant_insert on public.suivis_consultant for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy suivis_consultant_update on public.suivis_consultant for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy suivis_consultant_delete on public.suivis_consultant for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
