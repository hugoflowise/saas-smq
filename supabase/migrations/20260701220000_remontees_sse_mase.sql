-- ============================================================================
-- MASE Axe 4 : remontées SSE + analyse d'événements
--
-- Étend le module « Remontées » (table reclamations) à la santé-sécurité-
-- environnement : nouveaux types de faits (situation dangereuse, presqu'accident,
-- maladie professionnelle, impact environnemental), domaine S/S/E, et analyse
-- des causes (arbre des causes / 5 pourquoi). La route et la table restent
-- « reclamations » (un client qualité seul ne voit pas les champs SSE).
-- ============================================================================

-- Nouveaux types de remontée (ADD VALUE hors transaction : OK en fichier isolé).
alter type public.remontee_type add value if not exists 'situation_dangereuse';
alter type public.remontee_type add value if not exists 'presqu_accident';
alter type public.remontee_type add value if not exists 'maladie_professionnelle';
alter type public.remontee_type add value if not exists 'impact_environnemental';

-- Origines d'action correspondantes (pour l'action liée générée dans le plan).
alter type public.action_origine add value if not exists 'situation_dangereuse';
alter type public.action_origine add value if not exists 'presqu_accident';
alter type public.action_origine add value if not exists 'maladie_professionnelle';
alter type public.action_origine add value if not exists 'impact_environnemental';

alter table public.reclamations
  add column if not exists domaine text
    check (domaine in ('securite', 'sante', 'environnement', 'qualite')),
  add column if not exists analyse_methode text
    check (analyse_methode in ('5_pourquoi', 'arbre_causes', 'autre')),
  add column if not exists analyse_causes text;
