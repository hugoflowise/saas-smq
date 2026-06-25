-- ============================================================================
-- §9.3 Revue de direction structurée
-- Structure les éléments d'entrée (§9.3.2 a→f) et de sortie (§9.3.3) exigés par
-- la norme, là où le module ne stockait que de l'ordre du jour / conclusions /
-- décisions en texte libre.
-- ============================================================================

alter table public.revues_direction
  add column if not exists entree_actions_anterieures text,   -- a) suivi des actions des revues précédentes
  add column if not exists entree_evolution_contexte text,    -- b) évolutions des enjeux internes/externes
  add column if not exists entree_performance_synthese text,  -- c) synthèse de la performance du SMQ
  add column if not exists entree_ressources text,            -- d) adéquation des ressources
  add column if not exists entree_efficacite_actions text,    -- e) efficacité des actions face aux risques & opportunités
  add column if not exists entree_opportunites text,          -- f) opportunités d'amélioration
  add column if not exists donnees_performance jsonb,         -- instantané des KPIs (§9.3.2 c) figé au moment de la revue
  add column if not exists donnees_capturees_le timestamptz,
  add column if not exists sortie_amelioration text,          -- décisions/actions d'amélioration
  add column if not exists sortie_changements text,           -- besoins de changement du SMQ
  add column if not exists sortie_ressources text;            -- besoins en ressources

-- Traçabilité §9.3.3 : rattacher les actions décidées en revue à la revue d'origine.
alter table public.actions
  add column if not exists revue_id uuid references public.revues_direction (id) on delete set null;
create index if not exists idx_actions_revue on public.actions (revue_id);
