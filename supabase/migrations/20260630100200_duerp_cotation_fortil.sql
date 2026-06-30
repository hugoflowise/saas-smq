-- ============================================================================
-- DUERP — alignement de la cotation sur la méthode du DUERP de référence (Fortil)
--
-- Avant : gravité/fréquence 1-4, double cotation brute + résiduelle (G×F).
-- Après : Risque Initial   Ri = Fréquence (F) × Gravité (G)
--           F ∈ {0,2,4,6,8} (0 = aucune exposition ; 2 = 1/an … 8 = 1/semaine)
--           G ∈ {2,4,8,16}  (2 = légère … 16 = mortelle)
--         Risque Résiduel Rr = arrondi(Ri ÷ M), M = niveau de maîtrise ∈ {1..4}.
--
-- La table des risques est recréée (le module n'est pas en production ; aucune
-- donnée réelle). Les tables duerp_unites_travail et duerp_familles sont
-- inchangées et conservées.
-- ============================================================================

drop table if exists public.duerp_risques cascade;

create table public.duerp_risques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  unite_id uuid not null references public.duerp_unites_travail (id) on delete cascade,
  famille_id uuid references public.duerp_familles (id) on delete set null,
  danger text not null,                       -- Situation dangereuse
  dommages text,                              -- Risques / dommages éventuels
  gravite int not null default 2 check (gravite in (2, 4, 8, 16)),
  frequence int not null default 2 check (frequence in (0, 2, 4, 6, 8)),
  ri int generated always as (gravite * frequence) stored,
  actions_existantes text,                    -- Mesures de maîtrise déjà en place
  maitrise int not null default 1 check (maitrise between 1 and 4),
  rr int generated always as
    ((round((gravite * frequence)::numeric / maitrise))::int) stored,
  actions_a_mettre text,                      -- Action(s) à mettre en place
  statut public.duerp_risque_statut not null default 'a_traiter',
  action_id uuid references public.actions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_duerp_risques_tenant on public.duerp_risques (tenant_id, unite_id);
create trigger trg_duerp_risques_updated_at before update on public.duerp_risques
  for each row execute function public.set_updated_at();

alter table public.duerp_risques enable row level security;

create policy duerp_risques_select on public.duerp_risques for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy duerp_risques_insert on public.duerp_risques for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy duerp_risques_update on public.duerp_risques for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
