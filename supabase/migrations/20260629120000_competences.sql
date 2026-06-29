-- ============================================================================
-- Module COMPÉTENCES (ISO 9001 §7.2) : preuves de compétence par personne.
--
-- Deux tables, multi-tenant et soft-delete (deleted_at), calquées sur le pattern
-- RLS des consultants/fournisseurs (auteur tracé via created_by/updated_by, le
-- rôle auditeur étant en lecture seule via le trigger d'audit global) :
--   * competences            : référentiel des compétences du tenant ;
--   * competences_personnes   : attribution d'une compétence à un consultant,
--                               avec niveaux requis/acquis, dates et échéance de
--                               validité, organisme, et pièce justificative
--                               (stockée dans le bucket privé « documents »).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Référentiel des compétences du tenant
-- ----------------------------------------------------------------------------
create table public.competences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  libelle text not null,
  categorie text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_competences_tenant on public.competences (tenant_id);
create trigger trg_competences_updated_at before update on public.competences
  for each row execute function public.set_updated_at();

alter table public.competences enable row level security;

create policy competences_select on public.competences for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy competences_insert on public.competences for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy competences_update on public.competences for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy competences_delete on public.competences for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- ----------------------------------------------------------------------------
-- Attribution d'une compétence à une personne de l'effectif
-- ----------------------------------------------------------------------------
create table public.competences_personnes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  consultant_id uuid not null references public.consultants (id) on delete cascade,
  competence_id uuid not null references public.competences (id) on delete cascade,
  niveau_requis text,
  niveau_acquis text,
  -- acquise / a_acquerir / a_recycler : statut de la compétence pour la personne.
  statut text not null default 'a_acquerir',
  date_obtention date,
  date_echeance date,
  organisme text,
  -- Pièce justificative (attestation, diplôme, habilitation) : chemin dans le
  -- bucket privé « documents » (1er segment = tenant_id) + nom d'origine.
  justificatif_path text,
  justificatif_nom text,
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_competences_personnes_tenant on public.competences_personnes (tenant_id);
create index idx_competences_personnes_consultant on public.competences_personnes (consultant_id);
create index idx_competences_personnes_competence on public.competences_personnes (competence_id);
create trigger trg_competences_personnes_updated_at before update on public.competences_personnes
  for each row execute function public.set_updated_at();

alter table public.competences_personnes enable row level security;

create policy competences_personnes_select on public.competences_personnes for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy competences_personnes_insert on public.competences_personnes for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy competences_personnes_update on public.competences_personnes for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy competences_personnes_delete on public.competences_personnes for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
