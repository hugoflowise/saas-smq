-- ============================================================================
-- Identifiant public de questionnaire de satisfaction (lien partageable)
-- Distinct de ingest_token (secret webhook) : celui-ci est destiné à être public.
-- ============================================================================

alter table public.tenants
  add column survey_token uuid not null default gen_random_uuid();

create unique index uq_tenants_survey_token on public.tenants (survey_token);
