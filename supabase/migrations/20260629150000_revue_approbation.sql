-- ============================================================================
-- Approbation de la revue de direction (ISO 9001 §9.3).
-- La colonne `approuve_par` existe déjà ; on ajoute la date d'approbation
-- pour tracer « Approuvée par … le … » sur la fiche et le compte rendu PDF.
-- ============================================================================

alter table public.revues_direction
  add column approuve_le timestamptz;
