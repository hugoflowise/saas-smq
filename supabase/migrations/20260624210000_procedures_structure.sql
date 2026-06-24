-- ============================================================================
-- Procédures structurées : rubriques standard (sur le modèle d'une procédure
-- maîtrisée type), en plus du « contenu / déroulement » qui reste un éditeur
-- de texte riche. Les listes (références, définitions) sont stockées en JSON
-- car toujours éditées d'un bloc avec la procédure.
-- ============================================================================

alter table public.procedures
  add column objet text,
  add column domaine_application text,
  add column resume text,
  add column diffusion text,
  add column glossaire_sigles text,
  add column glossaire_symboles text,
  add column glossaire_abreviations text,
  add column definitions jsonb not null default '[]'::jsonb,
  add column references_doc jsonb not null default '[]'::jsonb,
  add column references_appli jsonb not null default '[]'::jsonb;
