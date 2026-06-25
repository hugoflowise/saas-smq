-- Intitulé long de la fiche d'identité (le nom court reste utilisé pour la
-- cartographie) et pilote « sans compte » (nom affiché, sans accès ni e-mail).
alter table public.processus
  add column if not exists intitule_long text,
  add column if not exists pilote_nom text;

comment on column public.processus.intitule_long is
  'Intitulé long affiché dans la fiche d''identité du processus. Le nom court (nom) reste affiché dans la cartographie.';
comment on column public.processus.pilote_nom is
  'Nom du pilote affiché lorsqu''il n''a pas de compte utilisateur (prioritaire sur pilote_id pour l''affichage uniquement).';
