-- ============================================================================
-- Suivi de prestation client (formulaire terrain BM) — ISO 9001 §9.1.2 / §8
-- Réponses complètes en JSONB + champs clés dénormalisés pour les KPIs.
-- ============================================================================

create table public.suivis_prestation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  -- Contexte (dénormalisé pour filtrage/affichage)
  consultant text,
  client text,
  mission text,
  manager text,
  date_suivi date,
  -- KPIs (dénormalisés)
  satisfaction_globale integer check (satisfaction_globale between 1 and 5),
  nps integer check (nps between 0 and 10),
  est_reclamation boolean not null default false,
  nouvelle_date_suivi date,
  -- Réponses complètes du formulaire
  reponses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_suivis_tenant on public.suivis_prestation (tenant_id, date_suivi);
create trigger trg_suivis_updated_at before update on public.suivis_prestation
  for each row execute function public.set_updated_at();

alter table public.suivis_prestation enable row level security;

create policy suivis_select on public.suivis_prestation for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy suivis_insert on public.suivis_prestation for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy suivis_update on public.suivis_prestation for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy suivis_delete on public.suivis_prestation for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
