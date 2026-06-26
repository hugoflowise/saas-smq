-- ============================================================================
-- « Remontées » : élargissement du module Réclamations à 4 types de remontées
-- (réclamation, dysfonctionnement, incident, accident) + lien optionnel vers une
-- action du plan d'actions. La route et la table restent « reclamations ».
-- ============================================================================

create type public.remontee_type as enum (
  'reclamation', 'dysfonctionnement', 'incident', 'accident'
);

alter table public.reclamations
  add column type public.remontee_type not null default 'reclamation',
  add column action_id uuid references public.actions (id) on delete set null;

-- Origines d'action correspondant aux nouveaux types (réclamation existe déjà).
alter type public.action_origine add value if not exists 'dysfonctionnement';
alter type public.action_origine add value if not exists 'incident';
alter type public.action_origine add value if not exists 'accident';
