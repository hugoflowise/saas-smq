-- ============================================================================
-- Offre premium : un Responsable Qualité Flowise (compte admin Flowise) peut
-- être rattaché à un client. Il devient sélectionnable comme pilote de
-- processus et visible côté client.
-- ============================================================================

alter table public.tenants
  add column responsable_flowise_id uuid references public.profiles (id) on delete set null;

-- Les membres d'un client peuvent lire le profil du Responsable Qualité Flowise
-- qui leur est rattaché (pour l'afficher comme pilote, par exemple). Sans cela,
-- la RLS profiles n'autorise que les profils du même tenant.
create policy profiles_select_rq_flowise on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.tenants t
      where t.id = public.jwt_tenant_id()
        and t.responsable_flowise_id = profiles.id
    )
  );
