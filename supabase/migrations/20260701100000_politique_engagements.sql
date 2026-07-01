-- ============================================================================
-- Engagements de la politique qualité (ISO 9001 §6.2)
-- ----------------------------------------------------------------------------
-- La politique qualité (texte libre) porte des engagements de la direction.
-- Pour démontrer §6.2 (« les objectifs qualité sont cohérents avec la politique »),
-- on structure ces engagements en une liste à laquelle on rattache les objectifs :
--   engagement → objectif(s) → indicateur(s).
-- Une matrice de couverture met en évidence les engagements non couverts.
-- ============================================================================

create table public.politique_engagements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  libelle text not null,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_politique_engagements_tenant on public.politique_engagements (tenant_id, ordre);

create trigger trg_politique_engagements_updated_at before update on public.politique_engagements
  for each row execute function public.set_updated_at();
create trigger trg_block_readonly before insert or update or delete on public.politique_engagements
  for each row execute function public.tg_block_readonly();

alter table public.politique_engagements enable row level security;

create policy politique_engagements_select on public.politique_engagements for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy politique_engagements_insert on public.politique_engagements for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy politique_engagements_update on public.politique_engagements for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy politique_engagements_delete on public.politique_engagements for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Rattachement d'un objectif à un engagement de la politique (facultatif).
alter table public.objectifs_qualite
  add column if not exists engagement_id uuid references public.politique_engagements (id) on delete set null;

comment on table public.politique_engagements is
  'Engagements de la politique qualité (§6.2), déclinés en objectifs puis indicateurs.';
