-- ============================================================================
-- Module 12 — Risques & Opportunités (CDC §5.2, §9 Module 12)
-- ============================================================================

create type public.ro_type as enum ('risque', 'opportunite');
create type public.ro_statut as enum ('identifie', 'en_traitement', 'maitrise', 'cloture');

create table public.risques_opportunites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  intitule text not null,
  type public.ro_type not null default 'risque',
  processus_id uuid references public.processus (id) on delete set null,
  cause text,
  consequence text,
  gravite integer not null default 1 check (gravite between 1 and 5),
  probabilite integer not null default 1 check (probabilite between 1 and 5),
  criticite integer generated always as (gravite * probabilite) stored,
  traitement_prevu text,
  responsable_id uuid references public.profiles (id) on delete set null,
  statut public.ro_statut not null default 'identifie',
  date_revue date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_ro_tenant on public.risques_opportunites (tenant_id, type, criticite desc);

create trigger trg_ro_updated_at
  before update on public.risques_opportunites
  for each row execute function public.set_updated_at();

alter table public.risques_opportunites enable row level security;

create policy ro_select on public.risques_opportunites
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );
create policy ro_insert on public.risques_opportunites
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy ro_update on public.risques_opportunites
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
