-- ============================================================================
-- Versions du registre (documents_maitrise) au format lettre
-- Suite de 20260626200000 : on convertit aussi les versions saisies « V1, V2… »
-- dans le registre vers le format lettre commun (A, B…). On ne touche qu'au
-- format strict « V<n> » (n = 1..26) ; toute autre saisie (ex. « V2.3 », « Rev A »,
-- version d'un document externe) est laissée telle quelle.
-- ============================================================================

update public.documents_maitrise
set version = chr(64 + (substring(version from '^[vV]([0-9]+)$'))::int)
where version ~ '^[vV][0-9]+$'
  and (substring(version from '^[vV]([0-9]+)$'))::int between 1 and 26;
