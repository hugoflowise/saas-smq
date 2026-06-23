-- ============================================================================
-- Éléments « proposés à valider »
-- ----------------------------------------------------------------------------
-- À la création d'un client, on préremplit des éléments « modèle » conseillés
-- (processus, actions de démarrage, parties prenantes types). Ces éléments
-- doivent être explicitement passés en revue par le client : tant qu'ils ne
-- sont pas validés, ils sont signalés et exclus des compteurs/tableau de bord.
--   propose   = true  -> élément issu d'un modèle Flowise (à revoir)
--   valide_le = null  -> pas encore validé par le client
-- Un élément est « à valider » quand propose = true ET valide_le IS NULL.
-- Les données existantes (propose = false par défaut) restent inchangées.
-- ============================================================================

alter table public.processus
  add column propose boolean not null default false,
  add column valide_le timestamptz;

alter table public.actions
  add column propose boolean not null default false,
  add column valide_le timestamptz;

alter table public.parties_interessees
  add column propose boolean not null default false,
  add column valide_le timestamptz;
