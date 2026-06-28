-- ============================================================================
-- Trigramme (code court) du processus : segment {PROCESSUS} des références
-- documentaires `{FAMILLE}_{PROCESSUS}_{CHRONO}` (ex. SMQ, DIR, RH).
-- Saisi par le client, réutilisé pour générer les codes de tous ses documents.
-- ============================================================================

alter table public.processus
  add column code text;

-- Unicité du trigramme par client (hors corbeille) : deux processus ne peuvent
-- pas partager le même code, sinon les références seraient ambiguës.
create unique index idx_processus_code_unique
  on public.processus (tenant_id, code)
  where code is not null and deleted_at is null;
