-- ============================================================================
-- Circuit à 3 rôles pour la FICHE D'IDENTITÉ de processus : ajout du
-- vérificateur signataire entre le rédacteur (soumission) et l'approbateur.
--
-- La table d'historique processus_fiche_versions n'a pas besoin de colonnes
-- dédiées : son `snapshot` (jsonb) fige déjà la fiche rendue, vérificateur
-- inclus.
-- ============================================================================

alter table public.processus
  add column fiche_verifie_par uuid references public.profiles (id) on delete set null,
  add column fiche_verifie_le timestamptz,
  add column fiche_verification_data jsonb;
