-- ============================================================================
-- Circuit à 3 rôles de la politique qualité : ajout du VÉRIFICATEUR entre le
-- rédacteur (soumission) et l'approbateur. La séparation des tâches
-- (approbateur ≠ rédacteur ≠ vérificateur) est garantie côté server action.
--
-- - politique_qualite : qui a vérifié, quand, et sa signature.
-- - politique_qualite_versions : on fige aussi le vérificateur dans l'historique.
-- ============================================================================

alter table public.politique_qualite
  add column verifie_par uuid references public.profiles (id) on delete set null,
  add column verifie_le timestamptz,
  add column verification_data jsonb;

alter table public.politique_qualite_versions
  add column verifie_par uuid references public.profiles (id) on delete set null,
  add column verifie_le timestamptz;
