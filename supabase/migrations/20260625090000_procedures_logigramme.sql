-- ============================================================================
-- Logigramme de procédure (éditeur draw.io / diagrams.net embarqué) :
-- - logigramme_xml : le diagramme éditable (format draw.io), pour ré-édition ;
-- - logigramme_svg : l'image exportée (data URL SVG), affichée dans le document
--   et le PDF.
-- Figé dans l'instantané de version via sections_snapshot (cf. publication).
-- ============================================================================

alter table public.procedures
  add column logigramme_xml text,
  add column logigramme_svg text;
