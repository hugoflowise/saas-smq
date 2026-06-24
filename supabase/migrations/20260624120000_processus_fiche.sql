-- ============================================================================
-- Fiche d'identité de processus : champs d'identité + activités + interactions
-- + bloc de validation (rédacteur / vérificateur / approbateur signataire).
-- ============================================================================

-- Champs d'identité (section 1) + bloc validation (section 9).
alter table public.processus
  add column finalite text,
  add column perimetre text,
  add column referentiels text,
  add column fiche_version text,
  add column fiche_redacteur text,
  add column fiche_verificateur text,
  add column fiche_approuvee_par uuid references public.profiles (id) on delete set null,
  add column fiche_approuvee_le timestamptz,
  add column fiche_signature jsonb,
  add column fiche_note_revision text;

-- Section 4 : description des activités.
create table public.processus_activites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  processus_id uuid not null references public.processus (id) on delete cascade,
  ordre integer not null default 0,
  activite text not null,
  responsable text,
  documents text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_processus_activites on public.processus_activites (processus_id, ordre);

-- Section 3 : interactions avec les autres processus (entrant = fournisseur,
-- sortant = client).
create type public.interaction_sens as enum ('entrant', 'sortant');
create table public.processus_interactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  processus_id uuid not null references public.processus (id) on delete cascade,
  ordre integer not null default 0,
  sens public.interaction_sens not null default 'entrant',
  partenaire text not null,
  nature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);
create index idx_processus_interactions on public.processus_interactions (processus_id, ordre);

-- Triggers (updated_at, audit, lecture seule auditeur) + RLS, sur le modèle
-- des autres tables enfant.
do $$
declare t text;
begin
  foreach t in array array['processus_activites', 'processus_interactions'] loop
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$s for each row execute function public.set_updated_at();', t);
    execute format('create trigger trg_%1$s_audit after insert or update or delete on public.%1$s for each row execute function public.tg_audit_log();', t);
    execute format('create trigger trg_%1$s_block before insert or update or delete on public.%1$s for each row execute function public.tg_block_readonly();', t);
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (deleted_at is null and (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id()));', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());', t);
  end loop;
end $$;
