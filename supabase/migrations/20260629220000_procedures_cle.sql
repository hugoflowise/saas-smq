-- Clé stable pour relier de façon déterministe une procédure « système »
-- (indépendamment de son titre, que le client peut renommer). Première usage :
-- la procédure de maîtrise de l'information documentée (ISO 9001 §7.5), qui doit
-- exister par défaut chez tous les clients et être atteignable en un clic depuis
-- la liste maîtresse des documents.

alter table public.procedures add column if not exists cle text;
comment on column public.procedures.cle is
  'Clé stable d''une procédure système (ex. maitrise_documentaire) pour la relier sans dépendre du titre.';

-- Au plus une procédure d'une clé donnée par client (hors corbeille).
create unique index if not exists procedures_tenant_cle_key
  on public.procedures (tenant_id, cle)
  where cle is not null and deleted_at is null;

-- Backfill : crée la procédure de maîtrise documentaire pour les clients qui n'en
-- ont pas encore (brouillon, à compléter/valider par le client).
insert into public.procedures (tenant_id, titre, statut, cle, objet, domaine_application, reference_iso)
select
  t.id,
  'Maîtrise de l''information documentée',
  'brouillon',
  'maitrise_documentaire',
  'Définir les règles de création, de validation, d''identification, de diffusion, de conservation et de maîtrise des informations documentées du SMQ (documents et enregistrements), conformément à l''exigence ISO 9001 §7.5.',
  'S''applique à l''ensemble des informations documentées du système de management de la qualité : documents internes (politique, procédures, instructions, formulaires) et externes, ainsi qu''aux enregistrements constituant des preuves.',
  array['7.5']
from public.tenants t
where not exists (
  select 1 from public.procedures p
  where p.tenant_id = t.id and p.cle = 'maitrise_documentaire' and p.deleted_at is null
);
