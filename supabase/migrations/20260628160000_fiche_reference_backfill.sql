-- ============================================================================
-- Référence des fiches d'identité de processus : convention « la fiche est
-- TOUJOURS DG_{trigramme}_001 ». On (re)pose ce code sur tous les processus qui
-- ont déjà un trigramme — les processus existants n'avaient pas été codifiés
-- car le backfill ne se déclenche qu'à la (re)saisie du trigramme.
--
-- Déterministe et idempotent : rejouer la migration redonne le même résultat.
-- ============================================================================

update public.processus
set fiche_reference = 'DG_' || code || '_001'
where code is not null
  and btrim(code) <> ''
  and deleted_at is null
  and coalesce(fiche_reference, '') <> 'DG_' || code || '_001';
