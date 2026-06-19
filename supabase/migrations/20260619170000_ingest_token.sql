-- ============================================================================
-- Jeton d'ingestion par tenant (webhook Microsoft Forms / Power Automate)
-- ============================================================================

alter table public.tenants
  add column ingest_token uuid not null default gen_random_uuid();

create unique index uq_tenants_ingest_token on public.tenants (ingest_token);
