-- ============================================================================
-- §10.2 — Vérification de l'efficacité des actions correctives (écart d'audit P0)
-- Consigner QUAND et AVEC QUEL RÉSULTAT l'efficacité d'une action a été vérifiée,
-- afin de ne plus clôturer une non-conformité sans verdict d'efficacité probant.
-- ============================================================================

-- Date à laquelle l'efficacité de l'action corrective a été vérifiée.
alter table public.actions
  add column date_verification_efficacite date;

-- Résultat de cette vérification (constat probant : efficace / inefficace, preuve).
alter table public.actions
  add column resultat_verification text;
