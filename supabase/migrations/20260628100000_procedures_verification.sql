-- ============================================================================
-- Circuit à 3 rôles pour les PROCÉDURES (comme la politique) : ajout du
-- vérificateur signataire entre le rédacteur (soumission) et l'approbateur.
-- Distinct des champs texte libres redacteur/verificateur (circuit de révision
-- manuel), qui restent inchangés.
-- ============================================================================

alter table public.procedures
  add column verifie_par uuid references public.profiles (id) on delete set null,
  add column verifie_le timestamptz,
  add column verification_data jsonb;

-- Rédacteur/vérificateur SIGNATAIRES figés dans l'historique des versions.
alter table public.procedures_versions
  add column redige_par uuid references public.profiles (id) on delete set null,
  add column redige_le timestamptz,
  add column verifie_par uuid references public.profiles (id) on delete set null,
  add column verifie_le timestamptz;
