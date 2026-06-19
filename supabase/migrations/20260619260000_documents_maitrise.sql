-- ============================================================================
-- Matrice documentaire (R13 v1, sans stockage de fichiers)
-- Registre central des documents maîtrisés non rédigés nativement dans l'app
-- (manuel qualité, instructions, enregistrements, documents externes...).
-- La politique et les procédures restent dans leurs tables et sont agrégées
-- côté lecture dans la page /documents.
-- ============================================================================

create type public.doc_maitrise_type as enum (
  'manuel', 'procedure', 'instruction', 'enregistrement', 'formulaire',
  'document_externe', 'autre'
);
create type public.doc_maitrise_statut as enum ('brouillon', 'en_vigueur', 'archive');

create table public.documents_maitrise (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  code text,
  titre text not null,
  type public.doc_maitrise_type not null default 'document_externe',
  version text,
  statut public.doc_maitrise_statut not null default 'en_vigueur',
  redacteur text,
  approbateur text,
  date_approbation date,
  date_revision_prevue date,
  processus_id uuid references public.processus (id) on delete set null,
  -- Où le document est physiquement rangé (chemin réseau, URL SharePoint...).
  emplacement text,
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_documents_maitrise_tenant
  on public.documents_maitrise (tenant_id, type);
create trigger trg_documents_maitrise_updated_at before update on public.documents_maitrise
  for each row execute function public.set_updated_at();

alter table public.documents_maitrise enable row level security;

create policy documents_maitrise_select on public.documents_maitrise for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy documents_maitrise_insert on public.documents_maitrise for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy documents_maitrise_update on public.documents_maitrise for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy documents_maitrise_delete on public.documents_maitrise for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Journalisation dans la main courante (cf. 20260619250000_main_courante.sql).
create trigger trg_audit_log after insert or update or delete on public.documents_maitrise
  for each row execute function public.tg_audit_log();
