-- ============================================================================
-- Module 3 — Politique qualité (1er document maîtrisé, CDC §5.2, §8)
-- ============================================================================

-- Statut commun à tous les documents maîtrisés (politique, procédures, modes op.)
create type public.document_statut as enum (
  'brouillon', 'en_revue', 'approuvee', 'publiee', 'archivee'
);

create table public.politique_qualite (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants (id) on delete cascade,
  contenu jsonb,
  statut public.document_statut not null default 'brouillon',
  version_actuelle_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger trg_politique_updated_at
  before update on public.politique_qualite
  for each row execute function public.set_updated_at();

create table public.politique_qualite_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  politique_id uuid not null references public.politique_qualite (id) on delete cascade,
  version text not null,
  contenu_snapshot jsonb,
  approved_by uuid references public.profiles (id) on delete set null,
  signature_data jsonb,
  approved_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now()
);

create index idx_politique_versions_politique on public.politique_qualite_versions (politique_id);

-- RLS
alter table public.politique_qualite enable row level security;
alter table public.politique_qualite_versions enable row level security;

create policy politique_select on public.politique_qualite
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy politique_insert on public.politique_qualite
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy politique_update on public.politique_qualite
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy politique_versions_select on public.politique_qualite_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy politique_versions_insert on public.politique_qualite_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
