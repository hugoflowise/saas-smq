-- ============================================================================
-- Fiche d'identité processus · §4 Description des activités
-- Suppression de la colonne « Documents / Outils » (et de son contenu) pour
-- toutes les fiches de tous les clients : ce champ n'est plus utilisé.
-- ============================================================================

alter table public.processus_activites drop column if exists documents;
