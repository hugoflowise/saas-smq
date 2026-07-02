-- ============================================================================
-- MASE Axe 4 : analyse des causes guidée des remontées SSE
--
-- Stocke le détail structuré de l'analyse selon la méthode choisie :
--   - 5 pourquoi : { p1..p5 }
--   - arbre des causes (5M / Ishikawa) : { main_oeuvre, materiel, methode, milieu, matiere }
-- La colonne analyse_causes existante sert de synthèse / cause racine retenue.
-- ============================================================================

alter table public.reclamations
  add column if not exists analyse_details jsonb;
