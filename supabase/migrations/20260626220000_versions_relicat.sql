-- ============================================================================
-- Homogénéisation finale des versions en lettres (A, B, C…)
--  1) Rattrapage des « Vn » résiduels (politique, procédures, registre) créés
--     pendant la fenêtre de déploiement de 20260626200000.
--  2) Registre : on force AUSSI les versions numériques saisies à la main
--     (« 1.0 », « 2.1 », « 3 »…) vers la lettre correspondant à leur numéro
--     majeur (1→A, 2→B…). Choix produit : versions de documents toujours en
--     lettres, y compris pour les documents externes du registre.
-- ============================================================================

update public.politique_qualite_versions
set version = chr(64 + (substring(version from '^[vV]([0-9]+)$'))::int)
where version ~ '^[vV][0-9]+$'
  and (substring(version from '^[vV]([0-9]+)$'))::int between 1 and 26;

update public.procedures_versions
set version = chr(64 + (substring(version from '^[vV]([0-9]+)$'))::int)
where version ~ '^[vV][0-9]+$'
  and (substring(version from '^[vV]([0-9]+)$'))::int between 1 and 26;

-- Registre : toute version commençant par un numéro (avec un « V » optionnel et
-- une éventuelle partie mineure « .x ») devient la lettre de son numéro majeur.
-- Les versions déjà en lettres ou non numériques sont laissées telles quelles.
update public.documents_maitrise
set version = chr(64 + least((substring(version from '^[vV]?([0-9]+)'))::int, 26))
where version ~ '^[vV]?[0-9]+'
  and (substring(version from '^[vV]?([0-9]+)'))::int between 1 and 26;
