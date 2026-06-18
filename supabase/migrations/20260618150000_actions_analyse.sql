-- ============================================================================
-- Plan d'actions : enrichissement « analyse de cause » (ISO 9001 §10)
-- Aligne la fiche action sur une logique constat → cause → action → reco.
-- ============================================================================

alter table public.actions
  add column constat text,
  add column cause_fondamentale text,
  add column recommandation text,
  -- Cotation de l'écart (réutilise l'échelle de conformité). Null = sans objet.
  add column cotation public.cotation_conformite;
