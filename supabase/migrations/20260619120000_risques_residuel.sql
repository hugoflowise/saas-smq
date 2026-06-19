-- ============================================================================
-- Risques : cotation résiduelle (après traitement) — ISO 9001 §6.1
-- Le brut (gravite × probabilite) existe déjà ; on ajoute le résiduel.
-- ============================================================================

alter table public.risques_opportunites
  add column gravite_residuelle integer check (gravite_residuelle between 1 and 5),
  add column probabilite_residuelle integer check (probabilite_residuelle between 1 and 5),
  add column criticite_residuelle integer
    generated always as (gravite_residuelle * probabilite_residuelle) stored;
