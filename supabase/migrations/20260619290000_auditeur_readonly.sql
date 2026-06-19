-- ============================================================================
-- Rôle « auditeur » en lecture seule
-- Défense en profondeur : un trigger BEFORE bloque toute écriture des comptes
-- dont le rôle JWT est 'auditeur' (l'admin Flowise et le service role passent).
-- ============================================================================

-- Rôle applicatif porté par le JWT (claim 'user_role', cf. custom_access_token_hook).
create or replace function public.jwt_user_role() returns text
  language sql stable as $$
  select coalesce(auth.jwt() ->> 'user_role', '');
$$;

create or replace function public.tg_block_readonly() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if public.jwt_user_role() = 'auditeur' then
    raise exception 'Accès en lecture seule : le rôle auditeur ne peut pas modifier les données.'
      using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
  tables text[] := array[
    'politique_qualite', 'procedures', 'procedures_versions', 'politique_qualite_versions',
    'actions', 'non_conformites', 'nc_actions', 'reclamations', 'risques_opportunites',
    'ro_actions', 'objectifs_qualite', 'audits_internes', 'audit_questions', 'audit_actions',
    'reunions', 'reunion_actions', 'revues_direction', 'fournisseurs', 'communications',
    'jalons_certification', 'processus', 'contexte_organisme', 'parties_interessees',
    'conformite_evaluation', 'veille_reglementaire', 'consultants', 'indicateurs',
    'indicateurs_valeurs', 'documents_maitrise', 'evenements_qualite'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_block_readonly on public.%I;', t);
    execute format(
      'create trigger trg_block_readonly before insert or update or delete on public.%I
         for each row execute function public.tg_block_readonly();', t);
  end loop;
end $$;
