-- ============================================================================
-- Procédures : circuit de révision (rédacteur / vérificateur / approbateur)
-- ISO 9001 §7.5 — maîtrise des informations documentées
-- ============================================================================

-- Rédacteur et vérificateur en texte libre (pas forcément des utilisateurs de l'app).
-- L'approbateur reste le signataire électronique (procedures.approved_by).
alter table public.procedures
  add column redacteur text,
  add column verificateur text,
  add column note_revision text;

-- Snapshot des responsabilités + note de modification dans chaque version publiée.
alter table public.procedures_versions
  add column redacteur text,
  add column verificateur text,
  add column note_revision text;
