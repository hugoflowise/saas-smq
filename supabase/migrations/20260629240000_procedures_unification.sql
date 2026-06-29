-- ============================================================================
-- Unification des procédures
-- ----------------------------------------------------------------------------
-- Contexte : des procédures ont été saisies par erreur comme lignes du registre
-- documentaire (documents_maitrise type='procedure') au lieu d'être rédigées
-- dans leur module natif. Conséquences observées chez les clients existants :
--   • un clic sur la procédure ouvre la fiche « document » et non la procédure ;
--   • la procédure n'apparaît pas dans le processus auquel elle est rattachée ;
--   • un doublon de la procédure de « maîtrise de l'information documentée »
--     (le stub seedé par 20260629220000 coexiste avec la version déjà rédigée).
--
-- Cette migration :
--   1) unifie la maîtrise documentaire : la version rédigée garde la clé stable
--      `maitrise_documentaire`, le doublon vide est mis à la corbeille ;
--   2) fusionne les lignes de registre « maîtrise documentaire » dans cette
--      procédure système (récupère code / processus) puis les supprime ;
--   3) convertit toutes les autres lignes de registre type='procedure' en
--      procédures natives (éditables, rattachées à leur processus) et supprime
--      les lignes de registre devenues redondantes.
--
-- Idempotente de fait : une fois exécutée, plus aucune ligne documents_maitrise
-- de type 'procedure' ne subsiste et l'index unique garantit une seule clé.
-- ============================================================================

-- Détection (insensible à l'accent et au libellé) de la procédure de maîtrise
-- documentaire : « maîtrise documentaire », « maîtrise des informations
-- documentées », « maîtrise de l'information documentée ».  Le radical « trise »
-- (maî**trise** / mai**trise**) suivi de « document » ou « information » suffit.

-- ---------------------------------------------------------------------------
-- 1) Maîtrise documentaire native : transférer la clé à la version rédigée et
--    mettre le stub seedé à la corbeille (l'ordre libère l'index unique).
-- ---------------------------------------------------------------------------
create temporary table _maitrise_merge on commit drop as
with stub as (
  select tenant_id, id as stub_id
  from public.procedures
  where cle = 'maitrise_documentaire' and deleted_at is null
)
select distinct on (p.tenant_id)
  p.tenant_id, p.id as proc_id, s.stub_id
from public.procedures p
join stub s on s.tenant_id = p.tenant_id and s.stub_id <> p.id
where p.deleted_at is null
  and p.cle is null
  and (lower(p.titre) like '%trise%document%' or lower(p.titre) like '%trise%information%')
order by p.tenant_id,
  (p.version_actuelle_id is not null) desc, -- priorité à la procédure publiée
  (p.code is not null) desc,
  length(coalesce(p.objet, '')) desc,       -- puis à la mieux renseignée
  p.created_at asc;

-- Corbeille du stub pour les clients qui possèdent une version rédigée.
update public.procedures
set deleted_at = now()
where id in (select stub_id from _maitrise_merge);

-- La version rédigée devient la procédure système (clé stable).
update public.procedures p
set cle = 'maitrise_documentaire'
from _maitrise_merge m
where p.id = m.proc_id;

-- ---------------------------------------------------------------------------
-- 2) Lignes de registre « maîtrise documentaire » : fusion dans la procédure
--    système (récupère code/processus si absents), puis suppression.
-- ---------------------------------------------------------------------------
update public.procedures p
set code = coalesce(p.code, dm.code),
    processus_id = coalesce(p.processus_id, dm.processus_id)
from (
  select distinct on (tenant_id) tenant_id, code, processus_id
  from public.documents_maitrise
  where type = 'procedure' and deleted_at is null
    and (lower(titre) like '%trise%document%' or lower(titre) like '%trise%information%')
  order by tenant_id, (code is not null) desc, created_at asc
) dm
where p.tenant_id = dm.tenant_id
  and p.cle = 'maitrise_documentaire'
  and p.deleted_at is null
  and (dm.code is not null and dm.code not like '%xxx%' or dm.processus_id is not null);

delete from public.documents_maitrise
where type = 'procedure' and deleted_at is null
  and (lower(titre) like '%trise%document%' or lower(titre) like '%trise%information%');

-- ---------------------------------------------------------------------------
-- 3) Conversion des autres lignes de registre type='procedure' en procédures
--    natives, puis suppression des lignes devenues redondantes.
--    Les codes « gabarit » (PR_SMQ_xxx…) sont remis à NULL : la procédure
--    recevra un code propre à sa codification.
-- ---------------------------------------------------------------------------
insert into public.procedures (tenant_id, titre, code, statut, processus_id, date_revision_prevue, created_at, updated_at)
select
  dm.tenant_id,
  dm.titre,
  case when dm.code like '%xxx%' then null else dm.code end,
  dm.statut::text::public.document_statut,
  dm.processus_id,
  dm.date_revision_prevue,
  dm.created_at,
  now()
from public.documents_maitrise dm
where dm.type = 'procedure' and dm.deleted_at is null;

delete from public.documents_maitrise
where type = 'procedure' and deleted_at is null;
