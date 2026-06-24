-- ============================================================================
-- Phase 2 : figer aussi les rubriques structurées (objet, références, glossaire,
-- définitions, résumé, diffusion) dans l'instantané de version d'une procédure,
-- en plus du contenu riche. Une version publiée restitue ainsi exactement l'état
-- du document à ce moment-là.
-- ============================================================================

alter table public.procedures_versions
  add column sections_snapshot jsonb;
