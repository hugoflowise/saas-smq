-- ============================================================================
-- Origine d'action « Analyse de contexte (SWOT/PESTEL) »
-- Sémantiquement plus juste que « Risques & Opportunités » pour une action
-- créée depuis un point du SWOT ou du PESTEL.
-- ============================================================================

alter type public.action_origine add value if not exists 'contexte';
