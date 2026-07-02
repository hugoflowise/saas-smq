-- ============================================================================
-- Lien traçable action <-> point SWOT/PESTEL
--
-- 1) Chaque point SWOT/PESTEL devient un objet { id, texte } (au lieu d'une
--    simple chaîne), pour un identifiant stable qui survit au réordonnancement
--    et à l'édition du texte. Les données existantes sont converties.
-- 2) L'action porte une référence vers le point d'origine : contexte_item_id
--    (l'id stable) + contexte_item_label (libellé dénormalisé pour l'affichage,
--    ex. « SWOT · Faiblesses : ... »).
-- Les snapshots de versions (contexte_versions) restent en texte : inchangés.
-- ============================================================================

-- 1) Conversion des points en { id, texte } sur la ligne vivante.
create or replace function public._contexte_items_add_ids(obj jsonb)
returns jsonb language plpgsql as $$
declare
  k text;
  v jsonb;
  item jsonb;
  newarr jsonb;
  res jsonb := '{}'::jsonb;
begin
  if obj is null then return obj; end if;
  for k, v in select * from jsonb_each(obj) loop
    if jsonb_typeof(v) = 'array' then
      newarr := '[]'::jsonb;
      for item in select * from jsonb_array_elements(v) loop
        if jsonb_typeof(item) = 'string' then
          newarr := newarr || jsonb_build_object('id', gen_random_uuid(), 'texte', item);
        elsif jsonb_typeof(item) = 'object' then
          if item ? 'id' then
            newarr := newarr || item;
          else
            newarr := newarr || (item || jsonb_build_object('id', gen_random_uuid()));
          end if;
        end if;
      end loop;
      res := res || jsonb_build_object(k, newarr);
    else
      res := res || jsonb_build_object(k, v);
    end if;
  end loop;
  return res;
end$$;

update public.contexte_organisme
set analyse_swot = public._contexte_items_add_ids(analyse_swot),
    analyse_pestel = public._contexte_items_add_ids(analyse_pestel)
where analyse_swot is not null or analyse_pestel is not null;

drop function public._contexte_items_add_ids(jsonb);

-- 2) Référence du point d'origine sur l'action.
alter table public.actions
  add column if not exists contexte_item_id uuid,
  add column if not exists contexte_item_label text;
