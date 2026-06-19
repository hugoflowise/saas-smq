-- ============================================================================
-- Référentiel des consultants (effectif, couverture ODM/PDP/visites médicales)
-- Saisie manuelle pour démarrer ; clé "reference" prête pour un import Boond.
-- ============================================================================

create table public.consultants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reference text,
  nom text not null,
  prenom text,
  entite text,
  poste text,
  date_demarrage date,
  date_fin date,
  odm boolean not null default false,
  pdp boolean not null default false,
  visite_medicale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_consultants_tenant on public.consultants (tenant_id);
create unique index uq_consultants_ref on public.consultants (tenant_id, reference)
  where reference is not null and deleted_at is null;
create trigger trg_consultants_updated_at before update on public.consultants
  for each row execute function public.set_updated_at();

alter table public.consultants enable row level security;

create policy consultants_select on public.consultants for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy consultants_insert on public.consultants for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy consultants_update on public.consultants for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy consultants_delete on public.consultants for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
