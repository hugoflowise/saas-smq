-- ============================================================================
-- Correctif : le trigger d'audit plantait sur les tables sans colonne
-- `deleted_at` (ex. contexte_organisme) avec « record "new" has no field
-- "deleted_at" ». En plpgsql, `new.deleted_at` est résolu même derrière le
-- garde `? 'deleted_at'`. On lit désormais la valeur depuis le JSONB
-- (v_new/v_old), ce qui évite toute référence à un champ inexistant.
-- ============================================================================

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
    -- Lecture via JSONB pour ne pas référencer new.deleted_at sur les tables
    -- qui n'ont pas cette colonne.
    if (v_new ? 'deleted_at')
       and ((v_new ->> 'deleted_at') is not null)
       and ((v_old ->> 'deleted_at') is null) then
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
