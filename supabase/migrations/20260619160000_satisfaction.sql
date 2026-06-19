-- ============================================================================
-- Satisfaction client (ISO 9001 §9.1.2) — réponses d'enquêtes / suivis de projet
-- Le NPS se calcule à partir de note_recommandation (0-10).
-- ============================================================================

create table public.enquetes_satisfaction (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  client text,
  date_reponse date not null default current_date,
  note_recommandation integer check (note_recommandation between 0 and 10),
  note_satisfaction numeric check (note_satisfaction between 0 and 10),
  commentaire text,
  est_reclamation boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_satisfaction_tenant on public.enquetes_satisfaction (tenant_id, date_reponse);
create trigger trg_satisfaction_updated_at before update on public.enquetes_satisfaction
  for each row execute function public.set_updated_at();

alter table public.enquetes_satisfaction enable row level security;

create policy satisfaction_select on public.enquetes_satisfaction for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy satisfaction_insert on public.enquetes_satisfaction for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy satisfaction_update on public.enquetes_satisfaction for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy satisfaction_delete on public.enquetes_satisfaction for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
