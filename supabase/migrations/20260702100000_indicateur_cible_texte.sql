-- ============================================================================
-- Indicateurs : cible descriptive en texte libre
--
-- Certaines cibles ne se réduisent pas à un nombre (ex. « ≥ 5 × salaire moyen
-- mensuel + 20 000 »). On ajoute une cible textuelle facultative : quand elle est
-- renseignée, elle prime sur la cible chiffrée pour l'affichage et l'alerte
-- « hors cible » automatique est désactivée (comparaison numérique impossible).
-- ============================================================================

alter table public.indicateurs
  add column if not exists cible_texte text;
