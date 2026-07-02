-- ============================================================================
-- Policies RLS DELETE manquantes : actions, processus, parties_interessees
--
-- Ces trois tables n'avaient que select/insert/update. Or le refus d'un élément
-- prérempli (« Refuser » / « Tout refuser ») fait une suppression PHYSIQUE de la
-- ligne encore proposée et non validée. Sans policy DELETE, la RLS bloquait
-- silencieusement l'opération (0 ligne supprimée, aucune erreur), d'où un refus
-- sans effet. On ajoute la policy DELETE, calquée sur la condition d'UPDATE
-- (même tenant, ou admin Flowise). Le rôle auditeur reste bloqué en écriture par
-- son trigger de lecture seule.
-- ============================================================================

drop policy if exists actions_delete on public.actions;
create policy actions_delete on public.actions
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

drop policy if exists processus_delete on public.processus;
create policy processus_delete on public.processus
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

drop policy if exists pi_delete on public.parties_interessees;
create policy pi_delete on public.parties_interessees
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
