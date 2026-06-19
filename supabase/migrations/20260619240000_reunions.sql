-- ============================================================================
-- Réunions QHSE : préparation, tenue en séance, actions, compte rendu
-- ============================================================================

alter type public.action_origine add value if not exists 'reunion';

create type public.reunion_type as enum (
  'comite_qhse', 'reunion_echange', 'revue', 'autre'
);
create type public.reunion_statut as enum ('planifiee', 'terminee');

create table public.reunions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  titre text not null,
  type public.reunion_type not null default 'comite_qhse',
  date_prevue date,
  date_realisation date,
  lieu text,
  animateur text,
  objectifs text,
  convoques text,
  presents text,
  -- Ordre du jour : tableau de points { sujet, prepa, discussion, decision, statut }
  points jsonb not null default '[]'::jsonb,
  synthese text,
  statut public.reunion_statut not null default 'planifiee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_reunions_tenant on public.reunions (tenant_id, date_prevue);
create trigger trg_reunions_updated_at before update on public.reunions
  for each row execute function public.set_updated_at();

alter table public.reunions enable row level security;

create policy reunions_select on public.reunions for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy reunions_insert on public.reunions for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy reunions_update on public.reunions for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy reunions_delete on public.reunions for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Liaison réunion -> actions du plan d'actions
create table public.reunion_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reunion_id uuid not null references public.reunions (id) on delete cascade,
  action_id uuid not null references public.actions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reunion_id, action_id)
);
create index idx_reunion_actions_reunion on public.reunion_actions (reunion_id);

alter table public.reunion_actions enable row level security;

create policy reunion_actions_select on public.reunion_actions for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy reunion_actions_insert on public.reunion_actions for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy reunion_actions_delete on public.reunion_actions for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
