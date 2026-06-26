-- ============================================================================
-- §4.3 Détermination du domaine d'application du SMQ
-- Énoncé du périmètre + justification des exclusions, comme information
-- documentée exigée par la norme. Un enregistrement par tenant.
-- ============================================================================

create table public.domaine_application (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants (id) on delete cascade,
  perimetre text,            -- énoncé du domaine d'application (activités, produits/services)
  sites text,                -- implantations / sites concernés
  exclusions jsonb not null default '[]'::jsonb, -- [{ clause, intitule, justification }]
  date_etablissement date,
  prochaine_revue date,
  valide_par uuid references public.profiles (id) on delete set null,
  valide_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger trg_domaine_updated_at
  before update on public.domaine_application
  for each row execute function public.set_updated_at();

-- RLS : isolation par tenant + accès admin Flowise
alter table public.domaine_application enable row level security;

create policy domaine_select on public.domaine_application
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy domaine_insert on public.domaine_application
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy domaine_update on public.domaine_application
  for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Rôle auditeur en lecture seule (cohérent avec les autres tables métier).
create trigger trg_block_readonly
  before insert or update or delete on public.domaine_application
  for each row execute function public.tg_block_readonly();
