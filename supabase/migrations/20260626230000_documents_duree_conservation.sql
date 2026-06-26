-- ============================================================================
-- Durée de stockage / conservation des documents maîtrisés (ISO 9001 §7.5.3)
-- Champ libre (ex. « 3 ans », « 5 ans », « Illimitée ») saisi dans le registre.
-- ============================================================================

alter table public.documents_maitrise add column duree_conservation text;
