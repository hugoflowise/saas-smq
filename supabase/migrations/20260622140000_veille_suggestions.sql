-- ============================================================================
-- Veille réglementaire semi-automatique : suggestions de textes (sources
-- officielles, ex. Légifrance/JO) à examiner par le client. La pertinence est
-- validée humainement (« retenir » crée une fiche de veille).
-- ============================================================================

-- Mots-clés de veille du client (séparés par des virgules), utilisés pour
-- filtrer les nouveaux textes officiels. Vide = pas de suggestions.
alter table public.tenants add column veille_mots_cles text;

create table public.veille_suggestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  source text not null default 'legifrance',
  ref text not null,
  titre text not null,
  domaine text,
  date_texte date,
  url text,
  resume text,
  statut text not null default 'nouvelle', -- nouvelle | retenue | ignoree
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
-- Évite les doublons d'un même texte pour un client.
create unique index uniq_veille_suggestion on public.veille_suggestions (tenant_id, source, ref);
create index idx_veille_suggestions_tenant on public.veille_suggestions (tenant_id, statut);

create trigger trg_veille_suggestions_updated_at before update on public.veille_suggestions
  for each row execute function public.set_updated_at();
create trigger trg_block_readonly before insert or update or delete on public.veille_suggestions
  for each row execute function public.tg_block_readonly();

alter table public.veille_suggestions enable row level security;

create policy veille_suggestions_select on public.veille_suggestions for select to authenticated
  using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));
create policy veille_suggestions_insert on public.veille_suggestions for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy veille_suggestions_update on public.veille_suggestions for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy veille_suggestions_delete on public.veille_suggestions for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
