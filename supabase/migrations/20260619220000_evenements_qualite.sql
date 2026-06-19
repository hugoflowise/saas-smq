-- ============================================================================
-- Événements qualité saisis manuellement (CODIR, réunions, jalons libres…)
-- Complète l'agrégation automatique du calendrier qualité.
-- ============================================================================

create table public.evenements_qualite (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  titre text not null,
  date_evenement date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_evenements_tenant on public.evenements_qualite (tenant_id, date_evenement);
create trigger trg_evenements_updated_at before update on public.evenements_qualite
  for each row execute function public.set_updated_at();

alter table public.evenements_qualite enable row level security;

create policy evenements_select on public.evenements_qualite for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy evenements_insert on public.evenements_qualite for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy evenements_update on public.evenements_qualite for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy evenements_delete on public.evenements_qualite for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
