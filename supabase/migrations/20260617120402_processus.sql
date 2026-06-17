-- ============================================================================
-- Module 2 — Cartographie des processus (CDC §5.2, §9 Module 2)
-- ============================================================================

create type public.processus_type as enum ('pilotage', 'realisation', 'support');

create table public.processus (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nom text not null,
  type public.processus_type not null,
  description text,
  pilote_id uuid references public.profiles (id) on delete set null,
  entrees text,
  sorties text,
  ressources_associees text,
  ordre_affichage integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_processus_tenant on public.processus (tenant_id, type, ordre_affichage);

create trigger trg_processus_updated_at
  before update on public.processus
  for each row execute function public.set_updated_at();

-- RLS : isolation par tenant + accès cross-tenant admin Flowise
alter table public.processus enable row level security;

create policy processus_select on public.processus
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );

create policy processus_insert on public.processus
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy processus_update on public.processus
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
