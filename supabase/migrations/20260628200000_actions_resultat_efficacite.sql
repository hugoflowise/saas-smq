-- ============================================================================
-- Plan d'actions : ajout de la colonne « Résultats mesurés / Efficacité de
-- l'action corrective ». Distincte de indicateur_efficacite (l'INDICATEUR) :
-- ici on consigne le RÉSULTAT mesuré et la conclusion d'efficacité, requis
-- pour les actions correctives / non-conformités.
-- ============================================================================

alter table public.actions
  add column resultat_efficacite text;
