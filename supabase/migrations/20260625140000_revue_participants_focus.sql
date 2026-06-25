-- ============================================================================
-- Revue de direction : participants + section libre « points spécifiques »
-- Inspiré de la trame de restitution (page Participants + sections focus métier).
-- ============================================================================

alter table public.revues_direction
  add column if not exists participants jsonb not null default '[]'::jsonb, -- [{ nom, fonction }]
  add column if not exists points_specifiques text;                         -- section libre (focus activité/entité)
