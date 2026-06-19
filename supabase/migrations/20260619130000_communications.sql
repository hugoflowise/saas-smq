-- ============================================================================
-- Module Communications (ISO 9001 §7.4 — communication interne et externe)
-- ============================================================================

create type public.communication_type as enum (
  'note_interne', 'communique', 'affichage', 'reunion', 'newsletter', 'autre'
);
create type public.communication_canal as enum (
  'email', 'intranet', 'affichage', 'reunion', 'courrier', 'autre'
);
create type public.communication_statut as enum ('planifiee', 'realisee');

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  sujet text not null,
  type public.communication_type not null default 'note_interne',
  canal public.communication_canal not null default 'email',
  audience text,
  message text,
  date_prevue date,
  date_realisee date,
  statut public.communication_statut not null default 'planifiee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_communications_tenant on public.communications (tenant_id, statut);
create trigger trg_communications_updated_at before update on public.communications
  for each row execute function public.set_updated_at();

alter table public.communications enable row level security;

create policy communications_select on public.communications for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy communications_insert on public.communications for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy communications_update on public.communications for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy communications_delete on public.communications for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
