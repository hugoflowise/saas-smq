-- ============================================================================
-- Processus : suivi des revues de processus (ISO 9001 §9.3 / §4.4)
-- ============================================================================

alter table public.processus
  add column date_derniere_revue date,
  add column date_prochaine_revue date;
