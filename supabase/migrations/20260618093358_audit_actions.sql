-- Liaison audits internes -> actions correctives (écarts traités)
create table public.audit_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  audit_id uuid not null references public.audits_internes (id) on delete cascade,
  action_id uuid not null references public.actions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (audit_id, action_id)
);
create index idx_audit_actions_audit on public.audit_actions (audit_id);

alter table public.audit_actions enable row level security;

create policy audit_actions_select on public.audit_actions for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy audit_actions_insert on public.audit_actions for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy audit_actions_delete on public.audit_actions for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
