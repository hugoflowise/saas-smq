-- ============================================================================
-- GED v2 : stockage de fichiers pour la matrice documentaire
-- Bucket privé « documents », isolé par tenant (1er segment du chemin = tenant_id).
-- ============================================================================

alter table public.documents_maitrise
  add column fichier_path text,
  add column fichier_nom text,
  add column fichier_taille integer;

-- Bucket privé.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Accès isolé par tenant : le 1er dossier du chemin doit valoir le tenant du JWT.
create policy "documents_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (public.is_admin_flowise() or (storage.foldername(name))[1] = public.jwt_tenant_id()::text)
  );
create policy "documents_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (public.is_admin_flowise() or (storage.foldername(name))[1] = public.jwt_tenant_id()::text)
  );
create policy "documents_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (public.is_admin_flowise() or (storage.foldername(name))[1] = public.jwt_tenant_id()::text)
  );
create policy "documents_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (public.is_admin_flowise() or (storage.foldername(name))[1] = public.jwt_tenant_id()::text)
  );
