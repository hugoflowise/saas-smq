-- ============================================================================
-- Formulaires personnalisables par client (Phase 1 — tuyauterie)
-- ----------------------------------------------------------------------------
-- Chaque client peut, à terme, adapter ses formulaires de suivi (ajouter /
-- supprimer / réordonner des questions « libres », reformuler les questions
-- « socle » verrouillées). La définition d'un formulaire est un tableau de
-- sections (même format que les constantes TS `SectionConfig`), stocké en JSONB.
--
-- Stratégie « fallback » : tant qu'un client n'a rien personnalisé, AUCUNE ligne
-- n'existe ici et l'application retombe sur le modèle par défaut codé en TS
-- (src/lib/suivi-consultant.ts). Une ligne n'est créée qu'au premier geste de
-- personnalisation (Phase 2). Aucune régression pour les clients existants.
--
-- `version` est incrémentée à chaque modification : chaque suivi enregistré
-- mémorise la version du modèle utilisé (colonne `modele_version` ci-dessous),
-- pour rester lisible dans le temps même après refonte du formulaire.
-- ============================================================================

create table public.formulaire_modeles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  -- Quel formulaire ce modèle décrit (un seul type wiré en Phase 1).
  type text not null check (type in ('suivi_consultant', 'suivi_prestation')),
  version integer not null default 1,
  -- Définition complète : tableau de sections (format SectionConfig en TS).
  definition jsonb not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul modèle actif par (client, type de formulaire).
create unique index formulaire_modeles_actif_unique
  on public.formulaire_modeles (tenant_id, type) where actif;
create index idx_formulaire_modeles_tenant on public.formulaire_modeles (tenant_id);

create trigger trg_formulaire_modeles_updated_at before update on public.formulaire_modeles
  for each row execute function public.set_updated_at();

-- Lecture seule pour le rôle auditeur (défense en profondeur).
create trigger trg_block_readonly before insert or update or delete on public.formulaire_modeles
  for each row execute function public.tg_block_readonly();

alter table public.formulaire_modeles enable row level security;

create policy formulaire_modeles_select on public.formulaire_modeles for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy formulaire_modeles_insert on public.formulaire_modeles for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy formulaire_modeles_update on public.formulaire_modeles for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy formulaire_modeles_delete on public.formulaire_modeles for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- Version du modèle utilisée au moment de la soumission (null = modèle par défaut TS).
alter table public.suivis_consultant
  add column if not exists modele_version integer;

comment on table public.formulaire_modeles is
  'Définition personnalisée des formulaires de suivi par client. Absence de ligne = modèle par défaut TS.';
comment on column public.suivis_consultant.modele_version is
  'Version du modèle de formulaire au moment de la soumission (null = modèle par défaut TS).';
