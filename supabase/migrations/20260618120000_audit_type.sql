-- ============================================================================
-- Audits : distinguer internes / externes / fournisseurs (ISO 9001 §9.2 & §8.4)
-- ============================================================================

create type public.audit_type as enum ('interne', 'externe', 'fournisseur');

alter table public.audits_internes
  add column type_audit public.audit_type not null default 'interne',
  -- Organisme concerné : certificateur (externe), client, ou fournisseur audité.
  add column organisme text;

create index idx_audits_tenant_type on public.audits_internes (tenant_id, type_audit);
