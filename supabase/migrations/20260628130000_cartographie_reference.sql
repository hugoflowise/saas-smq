-- ============================================================================
-- Référence documentaire de la cartographie des processus (ex. « DG_SMQ_001 »).
-- La cartographie est un document unique par client (vue dérivée des processus,
-- sans table maître) : sa codification vit donc sur le tenant.
-- ============================================================================

alter table public.tenants
  add column cartographie_reference text;
