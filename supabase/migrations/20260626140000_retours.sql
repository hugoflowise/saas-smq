-- ============================================================================
-- Retours utilisateurs : bugs, remarques et demandes d'évolution
-- Tout utilisateur authentifié (client, Léa, équipe) peut en soumettre depuis
-- l'app ; l'admin Flowise les revoit dans un backlog. Données produit (pas QMS),
-- donc hors isolation par tenant : chacun voit les siens, l'admin voit tout.
-- ============================================================================

create type public.retour_type as enum ('bug', 'amelioration', 'remarque');
create type public.retour_statut as enum ('nouveau', 'en_cours', 'traite', 'rejete');

create table public.retours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  type public.retour_type not null default 'remarque',
  titre text not null,
  description text,
  page_url text,
  statut public.retour_statut not null default 'nouveau',
  note_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);
create index idx_retours_statut on public.retours (statut, created_at desc);

create trigger trg_retours_updated_at
  before update on public.retours
  for each row execute function public.set_updated_at();

alter table public.retours enable row level security;

-- Tout utilisateur authentifié peut créer son propre retour.
create policy retours_insert on public.retours
  for insert to authenticated
  with check (created_by = (select auth.uid()));

-- L'auteur voit ses retours ; l'admin Flowise voit tout.
create policy retours_select on public.retours
  for select to authenticated
  using (public.is_admin_flowise() or created_by = (select auth.uid()));

-- Seul l'admin Flowise traite (statut / note interne).
create policy retours_update on public.retours
  for update to authenticated
  using (public.is_admin_flowise())
  with check (public.is_admin_flowise());
