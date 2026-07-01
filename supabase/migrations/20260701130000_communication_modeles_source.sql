-- ============================================================================
-- Modèles de communication : origine (modèle fourni matérialisé)
-- ----------------------------------------------------------------------------
-- Les modèles « fournis » (constantes MODELES_INTEGRES) doivent pouvoir être
-- modifiés et recevoir des pièces jointes, comme les modèles créés par le client.
-- Au premier enregistrement, le modèle fourni est « matérialisé » : une copie
-- éditable est créée en base, `modele_source` mémorisant l'id du modèle fourni
-- d'origine (pour ne l'afficher qu'une fois : la copie remplace le fourni).
-- ============================================================================

alter table public.communication_modeles
  add column modele_source text;

comment on column public.communication_modeles.modele_source is
  'Id du modèle fourni (MODELES_INTEGRES) dont ce modèle est la copie éditable ; null si créé de zéro.';
