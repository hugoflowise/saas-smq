-- ============================================================================
-- Remontées via formulaire public (lien / QR) — ISO 9001 §9.1.2 / §10.2
-- ----------------------------------------------------------------------------
-- Une remontée (réclamation, dysfonctionnement, incident, accident) peut être
-- déposée par une personne externe sans compte (client, business manager) via
-- un lien public porté par le `survey_token` du tenant. On conserve l'identité
-- du déclarant pour le suivi. Le canal utilisé est 'enquete' (saisie en self-
-- service), aucune nouvelle valeur d'enum n'est nécessaire.
-- ============================================================================

alter table public.reclamations
  add column if not exists declarant_nom text,
  add column if not exists declarant_email text;

comment on column public.reclamations.declarant_nom is
  'Nom / société du déclarant (remontée déposée via le formulaire public, sans compte).';
comment on column public.reclamations.declarant_email is
  'E-mail du déclarant, pour le recontacter (remontée via formulaire public).';
