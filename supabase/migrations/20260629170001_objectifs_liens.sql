-- §6.2.2 : planification des actions pour atteindre les objectifs qualité.
-- 1) Lien direct action → objectif (une action contribue à un objectif).
-- 2) Trace d'établissement / validation des objectifs par la direction
--    (sur le modèle de domaine_application).

-- Lien direct : on garde l'action si l'objectif est supprimé.
alter table public.actions
  add column if not exists objectif_id uuid
    references public.objectifs_qualite (id) on delete set null;

create index if not exists idx_actions_objectif_id
  on public.actions (objectif_id);

-- Preuve d'établissement / validation par la direction.
alter table public.objectifs_qualite
  add column if not exists valide_par uuid
    references public.profiles (id) on delete set null;

alter table public.objectifs_qualite
  add column if not exists valide_le timestamptz;
