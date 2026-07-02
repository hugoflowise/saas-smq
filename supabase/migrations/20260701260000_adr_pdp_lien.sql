-- ============================================================================
-- MASE Axe 3 : lien vers le document du plan de prévention (PDP)
--
-- En MASE, 100 % des interventions doivent être couvertes par un plan de
-- prévention : on stocke le lien/référence du document co-signé (le PDP requis
-- n'est plus optionnel côté saisie).
-- ============================================================================

alter table public.analyses_risques
  add column if not exists pdp_lien text;
