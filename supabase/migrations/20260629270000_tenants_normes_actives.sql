-- ============================================================================
-- Multi-normes : normes activées par client (gating des modules)
-- ----------------------------------------------------------------------------
-- Un client peut piloter plusieurs référentiels (ISO 9001, MASE, ISO 14001,
-- ISO 45001, CEFRI…). Les modules de l'application sont affichés selon les
-- normes actives (cf. src/lib/modules.ts) :
--   • socle      : toujours visible (transverse + obligations légales, ex. DUERP)
--   • tronc commun : visible dès qu'au moins une norme est active
--   • métier     : visible si la norme correspondante est active
--
-- `normes_actives` est ORTHOGONAL à `formule` (offre commerciale). Tous les
-- clients existants reçoivent {'9001'} (aucune régression).
-- ============================================================================

alter table public.tenants
  add column if not exists normes_actives text[] not null default array['9001']::text[];

comment on column public.tenants.normes_actives is
  'Référentiels activés pour ce client (ex. {9001, MASE}). Pilote l''affichage des modules. Réglé par l''admin Flowise.';
