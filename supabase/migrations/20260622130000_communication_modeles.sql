-- ============================================================================
-- Communications (ISO 9001 §7.4) : bibliothèque de modèles d'e-mails type +
-- adresse de liste de diffusion (envoi « toute la société »).
-- ============================================================================

-- Adresse de liste de diffusion Microsoft 365 (ex. tous@flowise.fr), gérée
-- côté Microsoft, renseignée dans Paramètres. Sert au destinataire « toute la
-- société » lors de l'envoi d'une communication.
alter table public.tenants add column liste_diffusion text;

-- Modèles d'e-mails personnalisés par client (les modèles fournis vivent dans
-- le code ; ceux-ci sont créés/édités par l'utilisateur).
create table public.communication_modeles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  categorie text not null default 'autre',
  titre text not null,
  objet text not null,
  corps text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_communication_modeles_tenant on public.communication_modeles (tenant_id, categorie);

create trigger trg_communication_modeles_updated_at before update on public.communication_modeles
  for each row execute function public.set_updated_at();

-- Lecture seule pour le rôle auditeur.
create trigger trg_block_readonly before insert or update or delete on public.communication_modeles
  for each row execute function public.tg_block_readonly();

alter table public.communication_modeles enable row level security;

create policy communication_modeles_select on public.communication_modeles for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy communication_modeles_insert on public.communication_modeles for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy communication_modeles_update on public.communication_modeles for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy communication_modeles_delete on public.communication_modeles for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
