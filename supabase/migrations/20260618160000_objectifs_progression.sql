-- ============================================================================
-- Objectifs qualité : suivi de progression (ISO 9001 §6.2)
-- ============================================================================

create type public.objectif_sens as enum ('hausse', 'baisse');

alter table public.objectifs_qualite
  add column valeur_cible numeric,
  add column valeur_actuelle numeric,
  add column unite text,
  add column sens public.objectif_sens not null default 'hausse',
  add column processus_id uuid references public.processus (id) on delete set null;
