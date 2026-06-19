-- ============================================================================
-- Lien objectif qualité <-> indicateur (ISO 9001 §6.2 / §9.1)
-- Un objectif peut être mesuré par un indicateur : sa progression suit alors
-- la dernière valeur mesurée de l'indicateur.
-- ============================================================================

alter table public.objectifs_qualite
  add column indicateur_id uuid references public.indicateurs (id) on delete set null;

create index idx_objectifs_indicateur on public.objectifs_qualite (indicateur_id);
