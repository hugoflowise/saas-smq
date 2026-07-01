-- ============================================================================
-- Formulaire « Suivi de prestation client » personnalisable (Phase 3)
-- ----------------------------------------------------------------------------
-- Comme pour le suivi consultant, chaque soumission mémorise la version du
-- modèle de formulaire utilisée (null = modèle par défaut codé en TS), afin de
-- rester lisible dans le temps même après une refonte du formulaire par le
-- client.
-- ============================================================================

alter table public.suivis_prestation
  add column if not exists modele_version integer;

comment on column public.suivis_prestation.modele_version is
  'Version du modèle de formulaire au moment de la soumission (null = modèle par défaut TS).';
