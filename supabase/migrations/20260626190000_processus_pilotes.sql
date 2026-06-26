-- ============================================================================
-- Plusieurs pilotes par processus
-- Jusqu'ici un seul pilote (processus.pilote_id / pilote_nom). On passe à une
-- liste : table enfant processus_pilotes, chaque ligne = un utilisateur lié
-- (pilote_id) OU une personne sans compte (pilote_nom). Les anciennes colonnes
-- sont conservées (compat) mais ne sont plus alimentées.
-- ============================================================================

create table public.processus_pilotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  processus_id uuid not null references public.processus (id) on delete cascade,
  ordre integer not null default 0,
  pilote_id uuid references public.profiles (id) on delete set null,
  pilote_nom text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  -- Au moins un utilisateur lié ou un nom libre.
  constraint processus_pilotes_identite check (
    pilote_id is not null or (pilote_nom is not null and btrim(pilote_nom) <> '')
  )
);
create index idx_processus_pilotes on public.processus_pilotes (processus_id, ordre);

-- Reprise de l'existant : un pilote unique devient la première ligne de la liste.
-- Nom libre prioritaire (personne sans compte), sinon l'utilisateur lié.
insert into public.processus_pilotes (tenant_id, processus_id, ordre, pilote_id, pilote_nom, created_by)
select
  pr.tenant_id,
  pr.id,
  0,
  case when pr.pilote_nom is null or btrim(pr.pilote_nom) = '' then pr.pilote_id end,
  case when pr.pilote_nom is not null and btrim(pr.pilote_nom) <> '' then pr.pilote_nom end,
  pr.created_by
from public.processus pr
where pr.pilote_id is not null
   or (pr.pilote_nom is not null and btrim(pr.pilote_nom) <> '');

-- Triggers (updated_at, audit, lecture seule auditeur) + RLS, sur le modèle des
-- autres tables enfant de processus.
do $$
declare t text;
begin
  foreach t in array array['processus_pilotes'] loop
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
