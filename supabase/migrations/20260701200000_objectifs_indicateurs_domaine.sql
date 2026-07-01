-- ============================================================================
-- MASE §1.3 / §1.4 — dimension domaine Sécurité / Santé / Environnement.
--
-- MASE exige que les objectifs et indicateurs couvrent les 3 domaines S/S/E.
-- On ajoute un champ `domaine` (nullable) aux objectifs et indicateurs : utilisé
-- quand la norme MASE est active, sans objet pour un client 9001 seul.
-- ============================================================================

alter table public.objectifs_qualite
  add column if not exists domaine text
    check (domaine in ('securite', 'sante', 'environnement', 'qualite'));

alter table public.indicateurs
  add column if not exists domaine text
    check (domaine in ('securite', 'sante', 'environnement', 'qualite'));
