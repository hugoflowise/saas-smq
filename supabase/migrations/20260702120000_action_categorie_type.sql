-- ============================================================================
-- Plan d'action v2 : catégorie (nature du constat) + type d'action enrichi
--
-- - « Catégorie » = nature du constat (liste métier de Léa), distincte de la
--   cotation d'audit (enum cotation_conformite, partagé et inchangé). Nouvel
--   enum dédié + colonne `categorie` sur actions.
-- - « Type d'action » : on complète l'enum action_type (préventive/corrective)
--   avec curative et amelioration.
-- ============================================================================

-- Type d'action : ajout de curative et amelioration.
alter type public.action_type add value if not exists 'curative';
alter type public.action_type add value if not exists 'amelioration';

-- Catégorie (nature du constat).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'action_categorie') then
    create type public.action_categorie as enum (
      'nc_mineure',
      'nc_majeure',
      'amelioration',
      'piste_progres',
      'opportunite',
      'point_sensible',
      'observation'
    );
  end if;
end$$;

alter table public.actions
  add column if not exists categorie public.action_categorie;
