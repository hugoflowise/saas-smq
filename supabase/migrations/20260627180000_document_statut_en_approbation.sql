-- ============================================================================
-- Nouveau statut « en_approbation » pour le circuit à 3 rôles des documents
-- maîtrisés : brouillon → en_revue (vérification) → en_approbation → approuvee.
--
-- L'ajout de valeur d'enum est isolé dans sa propre migration (commit) pour
-- pouvoir être utilisé par les migrations / le code suivants.
-- ============================================================================

alter type public.document_statut add value if not exists 'en_approbation' after 'en_revue';
