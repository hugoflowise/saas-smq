-- ============================================================================
-- Suppression d'une version de cartographie créée par erreur.
-- La table avait SELECT + INSERT mais pas de policy DELETE : avec RLS activé,
-- toute suppression était refusée silencieusement (0 ligne, sans erreur).
-- On autorise la suppression aux membres du tenant (l'auditeur en lecture seule
-- reste bloqué par le trigger global) et à l'admin Flowise.
-- ============================================================================

create policy cartographie_versions_delete on public.cartographie_versions
  for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
