-- ============================================================================
-- Indicateurs : sens de l'objectif (≥ cible pour "hausse", ≤ cible pour
-- "baisse"), sur le modèle de la fiche de référence. Remplace la logique des
-- seuils mini/maxi (colonnes conservées mais plus utilisées) par une alerte
-- "hors cible" calculée à partir de la cible et du sens.
-- ============================================================================

alter table public.indicateurs
  add column sens public.objectif_sens not null default 'hausse';
