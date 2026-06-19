-- ============================================================================
-- Cycle de certification : jalons (audit blanc, certification, surveillance…)
-- ============================================================================

create type public.jalon_type as enum (
  'audit_blanc', 'audit_certification', 'audit_surveillance', 'revue', 'autre'
);
create type public.jalon_statut as enum ('planifie', 'realise');

create table public.jalons_certification (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  libelle text not null,
  type public.jalon_type not null default 'autre',
  date_jalon date,
  statut public.jalon_statut not null default 'planifie',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_jalons_tenant on public.jalons_certification (tenant_id, date_jalon);
create trigger trg_jalons_updated_at before update on public.jalons_certification
  for each row execute function public.set_updated_at();

alter table public.jalons_certification enable row level security;

create policy jalons_select on public.jalons_certification for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy jalons_insert on public.jalons_certification for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy jalons_update on public.jalons_certification for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy jalons_delete on public.jalons_certification for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
