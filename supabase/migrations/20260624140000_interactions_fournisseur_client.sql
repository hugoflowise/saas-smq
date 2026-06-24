-- ============================================================================
-- Section 3 de la fiche : interactions modélisées comme dans la fiche de
-- référence, en 3 colonnes explicites (processus fournisseur / nature /
-- processus client) au lieu d'un sens + partenaire unique.
-- ============================================================================

alter table public.processus_interactions
  add column fournisseur text,
  add column client text;

-- Reprise des données existantes : pour un sens "entrant", le partenaire est le
-- fournisseur et le processus courant le client ; inversement pour "sortant".
update public.processus_interactions i
set
  fournisseur = case when i.sens = 'entrant' then i.partenaire else p.nom end,
  client = case when i.sens = 'entrant' then p.nom else i.partenaire end
from public.processus p
where p.id = i.processus_id;
