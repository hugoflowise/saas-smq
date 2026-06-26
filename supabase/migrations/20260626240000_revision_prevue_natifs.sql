-- ============================================================================
-- Date de révision prévue sur les documents natifs (politique, procédures)
-- Permet d'éditer la « révision prévue » depuis la liste maîtresse pour tous les
-- documents, pas seulement le registre. Les fiches de processus réutilisent leur
-- colonne existante date_prochaine_revue (pas de changement ici).
-- ============================================================================

alter table public.politique_qualite add column date_revision_prevue date;
alter table public.procedures add column date_revision_prevue date;
