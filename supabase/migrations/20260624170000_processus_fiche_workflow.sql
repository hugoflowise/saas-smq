-- ============================================================================
-- Fiche d'identité de processus : cycle de vie « document maîtrisé » aligné sur
-- la politique / les procédures (brouillon -> en revue -> approuvée -> publiée).
-- Rédacteur / vérificateur / approbateur et version se remplissent
-- automatiquement au fil du workflow. Référence et date de publication ajoutées
-- pour l'en-tête du document.
-- ============================================================================

alter table public.processus
  add column fiche_statut public.document_statut not null default 'brouillon',
  add column fiche_reference text,
  add column fiche_redige_par uuid references public.profiles (id) on delete set null,
  add column fiche_redige_le timestamptz,
  add column fiche_soumis_par uuid references public.profiles (id) on delete set null,
  add column fiche_soumis_le timestamptz,
  add column fiche_publiee_le timestamptz;
