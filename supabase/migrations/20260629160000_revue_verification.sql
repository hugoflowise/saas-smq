-- ============================================================================
-- Circuit de vérification + signature de la revue de direction (ISO 9001 §9.3).
-- On renforce l'approbation simple existante (approuve_par/approuve_le) par une
-- étape de vérification préalable et la séparation des tâches, à l'image du
-- circuit documentaire (procédures/politique).
--   verifie_par / verifie_le : qui a vérifié la revue, et quand.
--   signature_data           : signature(s) électronique(s) {verificateur,
--                              approbateur} (horodatage / IP / user agent), à
--                              l'image de la colonne signature_data des documents.
-- ============================================================================

alter table public.revues_direction
  add column verifie_par uuid references public.profiles (id),
  add column verifie_le timestamptz,
  add column signature_data jsonb;
