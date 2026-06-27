-- ============================================================================
-- Rédacteur dans l'historique des versions de la politique qualité.
--
-- politique_qualite_versions ne conservait que l'approbateur. On ajoute le
-- rédacteur (qui a soumis la version à approbation) pour afficher « Rédigé par »
-- dans l'aperçu d'une version figée, au même titre que l'approbateur.
--
-- Les versions déjà publiées avant cette migration restent sans rédacteur
-- (donnée non capturée à l'époque) ; les futures publications le renseignent.
-- ============================================================================

alter table public.politique_qualite_versions
  add column redige_par uuid references public.profiles (id) on delete set null,
  add column redige_le timestamptz;
