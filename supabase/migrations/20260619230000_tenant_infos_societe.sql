-- ============================================================================
-- Informations légales de la société (pied de page des documents PDF officiels)
-- ============================================================================

alter table public.tenants
  add column forme_juridique text,
  add column siret text,
  add column adresse text,
  add column code_postal text,
  add column ville text,
  add column mentions_legales text;
