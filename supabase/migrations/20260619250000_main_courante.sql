-- ============================================================================
-- Main courante : journalisation automatique des écritures (audit_log)
-- Un trigger générique enregistre create / update / delete sur les tables
-- métier, avec le diff des champs modifiés et un libellé lisible de l'entité.
-- ============================================================================

-- Libellé lisible de l'entité (référence ou titre, selon ce qui existe).
alter table public.audit_log add column if not exists entity_label text;

create or replace function public.audit_entity_label(r jsonb) returns text
  language sql immutable as $$
  select left(coalesce(
    nullif(r->>'reference', ''),
    nullif(r->>'titre', ''),
    nullif(r->>'intitule', ''),
    nullif(r->>'objet', ''),
    nullif(r->>'sujet', ''),
    nullif(r->>'nom', ''),
    nullif(r->>'nom_societe', ''),
    nullif(r->>'description_courte', ''),
    nullif(r->>'description', '')
  ), 160);
$$;

-- Trigger générique : à attacher en AFTER INSERT/UPDATE/DELETE.
create or replace function public.tg_audit_log() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid;
  v_action text;
  v_entity uuid;
  v_label  text;
  v_diff   jsonb;
  v_new    jsonb;
  v_old    jsonb;
  -- Champs techniques exclus du diff.
  v_noise  text[] := array['updated_at','created_at','updated_by','created_by','search_vector'];
begin
  if (tg_op = 'DELETE') then
    v_old := to_jsonb(old);
    v_tenant := old.tenant_id;
    v_entity := old.id;
    v_action := 'delete';
    v_label  := public.audit_entity_label(v_old);
    v_diff   := null;
  elsif (tg_op = 'INSERT') then
    v_new := to_jsonb(new);
    v_tenant := new.tenant_id;
    v_entity := new.id;
    v_action := 'create';
    v_label  := public.audit_entity_label(v_new);
    v_diff   := null;
  else
    v_new := to_jsonb(new);
    v_old := to_jsonb(old);
    v_tenant := new.tenant_id;
    v_entity := new.id;
    v_label  := public.audit_entity_label(v_new);

    -- Suppression logique = delete dans la main courante.
    if (v_new ? 'deleted_at') and (new.deleted_at is not null) and (old.deleted_at is null) then
      v_action := 'delete';
      v_diff := null;
    else
      v_action := 'update';
      select jsonb_object_agg(
               n.key,
               jsonb_build_object('avant', v_old -> n.key, 'apres', n.value)
             )
        into v_diff
        from jsonb_each(v_new) n
        where (v_old -> n.key) is distinct from n.value
          and not (n.key = any(v_noise));
      -- Aucun champ métier modifié : on ne journalise pas.
      if v_diff is null then
        return null;
      end if;
    end if;
  end if;

  insert into public.audit_log (tenant_id, user_id, action, entity_type, entity_id, entity_label, diff)
  values (v_tenant, auth.uid(), v_action, tg_table_name, v_entity, v_label, v_diff);

  return null;
end;
$$;

-- Attache le trigger aux tables métier (hors tables de liaison, snapshots,
-- valeurs à fort volume et données de formulaires publics).
do $$
declare
  t text;
  tables text[] := array[
    'politique_qualite', 'procedures', 'actions', 'non_conformites', 'reclamations',
    'risques_opportunites', 'objectifs_qualite', 'audits_internes', 'reunions',
    'revues_direction', 'fournisseurs', 'communications', 'jalons_certification',
    'processus', 'contexte_organisme', 'parties_interessees', 'conformite_evaluation',
    'veille_reglementaire', 'consultants', 'indicateurs'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_audit_log on public.%I;', t);
    execute format(
      'create trigger trg_audit_log after insert or update or delete on public.%I
         for each row execute function public.tg_audit_log();', t);
  end loop;
end $$;
