-- ============================================================================
-- Clients (tenants) : drapeau Bureau d'études + suppression réversible
-- - bureau_etudes : la société a une activité de conception/BE (§8.3), pour
--   piloter plus tard l'activation du module conception. Métadonnée pour l'instant.
-- - deleted_at : soft-delete (corbeille réversible) d'un client.
-- Le secteur conserve son enum ; « AT » n'est simplement plus proposé à la saisie.
-- ============================================================================

alter table public.tenants
  add column if not exists bureau_etudes boolean not null default false,
  add column if not exists deleted_at timestamptz;
