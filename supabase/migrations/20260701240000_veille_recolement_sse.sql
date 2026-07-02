-- ============================================================================
-- MASE Axe 4 : récolement de la veille SSE (4 étapes)
--
-- Complète la veille réglementaire pour le récolement attendu en SSE :
--   1. identification (le texte : intitulé/référence/date, déjà présent)
--   2. applicabilité  (le texte s'applique-t-il à l'entreprise ?)  -> ci-dessous
--   3. conformité     (l'entreprise est-elle conforme ?)          -> ci-dessous
--   4. actions        (actions de mise en conformité, déjà présent)
-- Colonnes optionnelles : un client qualité seul n'a pas à les renseigner.
-- ============================================================================

alter table public.veille_reglementaire
  add column if not exists applicabilite text
    check (applicabilite in ('applicable', 'non_applicable', 'a_evaluer')),
  add column if not exists conformite text
    check (conformite in ('conforme', 'non_conforme', 'partielle', 'a_evaluer'));
