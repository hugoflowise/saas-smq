-- ============================================================================
-- Codes par défaut des documents de management déjà versionnés, pour compléter
-- le plan DG_SMQ_xxx. Numéros réservés, éditables ensuite par le client.
--   - Politique qualité       → DG_SMQ_004
--   - Cartographie processus  → DG_SMQ_002 (référence portée par le tenant)
-- DEFAULT pour les futurs clients + backfill des valeurs manquantes (on ne
-- touche pas aux codes déjà saisis).
-- ============================================================================

alter table public.politique_qualite alter column code set default 'DG_SMQ_004';
update public.politique_qualite
  set code = 'DG_SMQ_004'
  where coalesce(code, '') = '';

alter table public.tenants alter column cartographie_reference set default 'DG_SMQ_002';
update public.tenants
  set cartographie_reference = 'DG_SMQ_002'
  where coalesce(cartographie_reference, '') = '';
