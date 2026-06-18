-- ============================================================================
-- Module 4 — Procédures (documents maîtrisés multiples, CDC §5.2, §8)
-- ============================================================================

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  titre text not null,
  processus_id uuid references public.processus (id) on delete set null,
  reference_iso text[],
  pilote_id uuid references public.profiles (id) on delete set null,
  description_courte text,
  contenu jsonb,
  statut public.document_statut not null default 'brouillon',
  version_actuelle_id uuid,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  signature_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_procedures_tenant on public.procedures (tenant_id, processus_id);

create trigger trg_procedures_updated_at
  before update on public.procedures
  for each row execute function public.set_updated_at();

create table public.procedures_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  version text not null,
  contenu_snapshot jsonb,
  approved_by uuid references public.profiles (id) on delete set null,
  signature_data jsonb,
  approved_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now()
);

create index idx_procedures_versions_procedure on public.procedures_versions (procedure_id);

-- RLS
alter table public.procedures enable row level security;
alter table public.procedures_versions enable row level security;

create policy procedures_select on public.procedures
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );
create policy procedures_insert on public.procedures
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy procedures_update on public.procedures
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy procedures_versions_select on public.procedures_versions
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy procedures_versions_insert on public.procedures_versions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
