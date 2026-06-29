-- ============================================================================
-- Liaison N–N Objectif ↔ Indicateurs (ISO 9001 §6.2 / §9.1)
-- ----------------------------------------------------------------------------
-- Un objectif qualité peut désormais être mesuré par PLUSIEURS indicateurs.
-- L'ancienne colonne `objectifs_qualite.indicateur_id` (un seul indicateur)
-- est conservée et continue de piloter la progression « tête de liste » quand
-- l'objectif n'a qu'un seul indicateur lié ; la table de liaison est la source
-- de vérité pour l'ensemble des indicateurs d'un objectif et pour le sens
-- inverse (« quels objectifs mesure cet indicateur ? » — détection d'orphelins).
-- ============================================================================

create table public.objectif_indicateurs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  objectif_id uuid not null references public.objectifs_qualite (id) on delete cascade,
  indicateur_id uuid not null references public.indicateurs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (objectif_id, indicateur_id)
);

create index idx_objectif_indicateurs_obj on public.objectif_indicateurs (objectif_id);
create index idx_objectif_indicateurs_ind on public.objectif_indicateurs (indicateur_id);

alter table public.objectif_indicateurs enable row level security;

create policy objectif_indicateurs_select on public.objectif_indicateurs
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy objectif_indicateurs_insert on public.objectif_indicateurs
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy objectif_indicateurs_delete on public.objectif_indicateurs
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Reprise : chaque objectif déjà relié à un indicateur (colonne historique)
-- obtient sa ligne de liaison correspondante.
insert into public.objectif_indicateurs (tenant_id, objectif_id, indicateur_id)
select o.tenant_id, o.id, o.indicateur_id
from public.objectifs_qualite o
where o.indicateur_id is not null and o.deleted_at is null
on conflict (objectif_id, indicateur_id) do nothing;
