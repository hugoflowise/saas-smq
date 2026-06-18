-- ============================================================================
-- Liaison Risques & Opportunités -> actions de traitement (ISO 9001 §6.1)
-- ============================================================================

create table public.ro_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ro_id uuid not null references public.risques_opportunites (id) on delete cascade,
  action_id uuid not null references public.actions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (ro_id, action_id)
);
create index idx_ro_actions_ro on public.ro_actions (ro_id);

alter table public.ro_actions enable row level security;

create policy ro_actions_select on public.ro_actions for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy ro_actions_insert on public.ro_actions for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy ro_actions_delete on public.ro_actions for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
