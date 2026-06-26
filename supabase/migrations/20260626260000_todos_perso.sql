-- ============================================================================
-- Pense-bête personnel (ToDo du quotidien)
-- Rattaché à l'utilisateur seul (PAS au tenant) : l'admin Flowise retrouve sa
-- liste quel que soit le client sur lequel il travaille. Volontairement léger :
-- une ligne de texte, cochable. Les tâches cochées sont purgées le lendemain ;
-- les tâches non cochées persistent jusqu'à ce qu'on les coche.
-- ============================================================================

create table public.todos_perso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  texte text not null,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_todos_perso_user on public.todos_perso (user_id, done);

-- RLS : chacun ne voit et ne gère QUE ses propres tâches (clé sur l'utilisateur,
-- pas le tenant). Pas de trigger lecture seule : même un auditeur gère son
-- pense-bête perso.
alter table public.todos_perso enable row level security;

create policy todos_perso_select on public.todos_perso for select to authenticated
  using (user_id = auth.uid());
create policy todos_perso_insert on public.todos_perso for insert to authenticated
  with check (user_id = auth.uid());
create policy todos_perso_update on public.todos_perso for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy todos_perso_delete on public.todos_perso for delete to authenticated
  using (user_id = auth.uid());
