-- ============================================================================
-- Fiche d'identité : ressources nécessaires détaillées par type (section 5),
-- sur le modèle de la fiche de référence (Humaines / Matérielles / Logicielles
-- et SI / Financières / Documentaires). L'ancienne colonne `ressources_associees`
-- est conservée comme repli de lecture pour les données déjà saisies.
-- ============================================================================

alter table public.processus
  add column ressources_humaines text,
  add column ressources_materielles text,
  add column ressources_logicielles text,
  add column ressources_financieres text,
  add column ressources_documentaires text;
