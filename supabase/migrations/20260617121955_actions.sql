-- ============================================================================
-- Module 5 — Plan d'actions (CDC §5.2, §9 Module 5)
-- ============================================================================

create type public.action_origine as enum (
  'manuelle', 'demarrage_smq', 'audit_interne', 'audit_externe',
  'nc', 'rdd', 'r_o', 'reclamation', 'amelioration_continue'
);
create type public.action_type as enum ('preventive', 'corrective');
create type public.action_priorite as enum ('p1', 'p2', 'p3');
create type public.action_statut as enum (
  'a_faire', 'en_cours', 'termine', 'bloquee', 'abandonnee'
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reference text not null,
  description_courte text not null,
  description_detail text,
  origine public.action_origine not null default 'manuelle',
  processus_concerne uuid references public.processus (id) on delete set null,
  reference_iso text[],
  type public.action_type not null default 'corrective',
  priorite public.action_priorite not null default 'p2',
  responsable_id uuid references public.profiles (id) on delete set null,
  date_creation date not null default current_date,
  date_prevue date,
  date_effective date,
  statut public.action_statut not null default 'a_faire',
  commentaires text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

create index idx_actions_tenant on public.actions (tenant_id, statut, priorite);

create trigger trg_actions_updated_at
  before update on public.actions
  for each row execute function public.set_updated_at();

-- RLS : isolation par tenant + accès cross-tenant admin Flowise
alter table public.actions enable row level security;

create policy actions_select on public.actions
  for select to authenticated
  using (
    deleted_at is null
    and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  );

create policy actions_insert on public.actions
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy actions_update on public.actions
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
