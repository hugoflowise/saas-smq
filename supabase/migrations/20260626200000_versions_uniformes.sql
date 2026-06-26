-- ============================================================================
-- Uniformisation des versions de documents en lettres (A, B, C…)
-- Les politiques et procédures publiées avant ce changement portaient des
-- versions « v1, v2… ». On les convertit au format lettre, désormais commun à
-- tous les documents maîtrisés (processus, politique, procédures).
--   v1 → A, v2 → B, … (chr(64 + n)). Au-delà de 26, on laisse tel quel (cas
--   très improbable pour un même document).
-- ============================================================================

update public.politique_qualite_versions
set version = chr(64 + (substring(version from '^[vV]([0-9]+)$'))::int)
where version ~ '^[vV][0-9]+$'
  and (substring(version from '^[vV]([0-9]+)$'))::int between 1 and 26;

update public.procedures_versions
set version = chr(64 + (substring(version from '^[vV]([0-9]+)$'))::int)
where version ~ '^[vV][0-9]+$'
  and (substring(version from '^[vV]([0-9]+)$'))::int between 1 and 26;
