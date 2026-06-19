-- ============================================================================
-- Évaluation des prestataires externes / fournisseurs (ISO 9001 §8.4)
-- ============================================================================

create type public.fournisseur_criticite as enum ('faible', 'moyenne', 'critique');
create type public.fournisseur_statut as enum ('actif', 'inactif');

create table public.fournisseurs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nom text not null,
  categorie text,
  contact text,
  criticite public.fournisseur_criticite not null default 'moyenne',
  note_evaluation integer check (note_evaluation between 1 and 5),
  date_evaluation date,
  prochaine_evaluation date,
  statut public.fournisseur_statut not null default 'actif',
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_fournisseurs_tenant on public.fournisseurs (tenant_id, criticite);
create trigger trg_fournisseurs_updated_at before update on public.fournisseurs
  for each row execute function public.set_updated_at();

alter table public.fournisseurs enable row level security;

create policy fournisseurs_select on public.fournisseurs for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy fournisseurs_insert on public.fournisseurs for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy fournisseurs_update on public.fournisseurs for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy fournisseurs_delete on public.fournisseurs for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
