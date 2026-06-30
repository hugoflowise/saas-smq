-- ============================================================================
-- DUERP — Document Unique d'Évaluation des Risques Professionnels
-- Obligation légale (Code du travail L4121-3 / R4121-1) dès 1 salarié → module
-- SOCLE, indépendant de toute certification. Modèle PROPRE, distinct de
-- risques_opportunites (R&O ISO 9001 §6.1).
--
-- Structure : unités de travail → risques (par famille INRS) → cotation
-- gravité × fréquence (brute + résiduelle après mesures) → action de prévention.
-- Familles INRS = table paramétrable par client (liste proposée à valider).
-- ============================================================================

create type public.duerp_risque_statut as enum ('a_traiter', 'en_cours', 'maitrise');

-- Familles de risques (nomenclature type INRS), éditables par client.
create table public.duerp_familles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  libelle text not null,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_duerp_familles_tenant on public.duerp_familles (tenant_id);
create trigger trg_duerp_familles_updated_at before update on public.duerp_familles
  for each row execute function public.set_updated_at();

-- Unités de travail (poste / métier / atelier regroupant des situations homogènes).
create table public.duerp_unites_travail (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  libelle text not null,
  description text,
  effectif_concerne int,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_duerp_unites_tenant on public.duerp_unites_travail (tenant_id);
create trigger trg_duerp_unites_updated_at before update on public.duerp_unites_travail
  for each row execute function public.set_updated_at();

-- Risques évalués, rattachés à une unité de travail.
-- Cotation = gravité (1-4) × fréquence d'exposition (1-4). Niveaux calculés.
-- Cotation résiduelle (après mesures) facultative : permet de prouver l'effet
-- des actions de prévention.
create table public.duerp_risques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  unite_id uuid not null references public.duerp_unites_travail (id) on delete cascade,
  famille_id uuid references public.duerp_familles (id) on delete set null,
  danger text not null,
  situation_exposition text,
  gravite_brute int not null default 1 check (gravite_brute between 1 and 4),
  frequence_brute int not null default 1 check (frequence_brute between 1 and 4),
  niveau_brut int generated always as (gravite_brute * frequence_brute) stored,
  mesures_existantes text,
  gravite_residuelle int check (gravite_residuelle between 1 and 4),
  frequence_residuelle int check (frequence_residuelle between 1 and 4),
  niveau_residuel int generated always as (gravite_residuelle * frequence_residuelle) stored,
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

-- RLS (motif commun : isolation tenant + admin Flowise, SELECT exclut la corbeille)
alter table public.duerp_familles enable row level security;
alter table public.duerp_unites_travail enable row level security;
alter table public.duerp_risques enable row level security;

create policy duerp_familles_select on public.duerp_familles for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy duerp_familles_insert on public.duerp_familles for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy duerp_familles_update on public.duerp_familles for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy duerp_unites_select on public.duerp_unites_travail for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy duerp_unites_insert on public.duerp_unites_travail for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy duerp_unites_update on public.duerp_unites_travail for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy duerp_risques_select on public.duerp_risques for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy duerp_risques_insert on public.duerp_risques for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy duerp_risques_update on public.duerp_risques for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id())
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Pré-remplissage des familles INRS pour chaque client existant.
-- Liste PROPOSÉE (nomenclature type INRS) — à valider/ajuster par le client.
insert into public.duerp_familles (tenant_id, libelle, ordre)
select t.id, f.libelle, f.ordre
from public.tenants t
cross join (values
  ('Chutes de plain-pied', 1),
  ('Chutes de hauteur', 2),
  ('Manutention manuelle', 3),
  ('Manutention mécanique / engins', 4),
  ('Circulation interne et déplacements', 5),
  ('Risque routier', 6),
  ('Risque chimique (dont CMR)', 7),
  ('Risque biologique', 8),
  ('Bruit', 9),
  ('Vibrations', 10),
  ('Ambiances thermiques', 11),
  ('Éclairage', 12),
  ('Risque électrique', 13),
  ('Incendie et explosion', 14),
  ('Équipements de travail et machines', 15),
  ('Travail sur écran', 16),
  ('Postures, gestes répétitifs (TMS)', 17),
  ('Risques psychosociaux (RPS)', 18),
  ('Travail isolé', 19),
  ('Rayonnements (ionisants / non ionisants)', 20),
  ('Organisation du travail et horaires atypiques', 21)
) as f(libelle, ordre);
