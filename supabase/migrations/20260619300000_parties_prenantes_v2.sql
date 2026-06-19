-- ============================================================================
-- Parties prenantes v2 — cotation de saillance (Pouvoir/Légitimité/Urgence)
-- + registre des attentes (risque/opportunité/maîtrise/criticité résiduelle).
-- Inspiré du registre Fortil, calculs automatisés. ISO 9001 §4.2.
-- ============================================================================

create type public.pi_sphere as enum ('interne', 'externe');
create type public.pi_interaction as enum ('faible', 'moyenne', 'forte', 'elevee');
create type public.pi_maitrise as enum ('maitrise', 'partiel', 'non_maitrise');

alter table public.parties_interessees
  add column sphere public.pi_sphere not null default 'externe',
  add column niveau_interaction public.pi_interaction not null default 'moyenne',
  add column pouvoir integer not null default 2 check (pouvoir between 1 and 3),
  add column legitimite integer not null default 2 check (legitimite between 1 and 3),
  add column urgence integer not null default 2 check (urgence between 1 and 3);

-- Registre des attentes : une partie prenante a plusieurs attentes.
create table public.pi_attentes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  partie_id uuid not null references public.parties_interessees (id) on delete cascade,
  attente text not null,
  risque text,
  opportunite text,
  maitrise public.pi_maitrise not null default 'partiel',
  moyens_maitrise text,
  processus_id uuid references public.processus (id) on delete set null,
  integration_pa boolean not null default false,
  action text,
  commentaire text,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_pi_attentes_partie on public.pi_attentes (partie_id, ordre);
create trigger trg_pi_attentes_updated_at before update on public.pi_attentes
  for each row execute function public.set_updated_at();
create trigger trg_pi_attentes_audit after insert or update or delete on public.pi_attentes
  for each row execute function public.tg_audit_log();
create trigger trg_pi_attentes_block before insert or update or delete on public.pi_attentes
  for each row execute function public.tg_block_readonly();

alter table public.pi_attentes enable row level security;

create policy pi_attentes_select on public.pi_attentes for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy pi_attentes_insert on public.pi_attentes for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy pi_attentes_update on public.pi_attentes for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy pi_attentes_delete on public.pi_attentes for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
