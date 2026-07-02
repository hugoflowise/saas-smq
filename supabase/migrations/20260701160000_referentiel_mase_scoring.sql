-- ============================================================================
-- Multi-normes — auto-diagnostic MASE noté (chantier 1a : schéma de scoring)
--
-- Le référentiel MASE 2024 est un questionnaire NOTÉ (points + cotation
-- B/V/VD + neutralisation), différent de la cotation qualitative ISO 9001.
-- On étend `referentiel_iso` (global, colonne `norme`) et l'évaluation par
-- tenant pour porter ces notes, sans rien changer au fonctionnement 9001.
-- ============================================================================

-- Référentiel : les colonnes MASE sont nullables (inutilisées côté 9001).
-- `domaine` (enum ISO §4-§10) n'a pas de sens pour MASE → on lève le NOT NULL,
-- les lignes MASE s'organisent par `axe` (1 à 5).
alter table public.referentiel_iso
  alter column domaine drop not null,
  add column if not exists axe smallint,
  add column if not exists points_max integer,
  add column if not exists cotation_type text
    check (cotation_type in ('B', 'V', 'VD')),
  add column if not exists neutralisable boolean not null default false;

-- Évaluation par tenant : pour MASE on saisit des points obtenus (0..points_max,
-- voire le double en renouvellement pour les questions VD) et un drapeau de
-- neutralisation (question exclue du calcul, justifiée au comité de pilotage).
alter table public.conformite_evaluation
  add column if not exists points_obtenus integer,
  add column if not exists neutralisee boolean not null default false;
