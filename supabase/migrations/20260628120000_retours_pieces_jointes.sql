-- ============================================================================
-- Pièces jointes des retours (signaler / suggérer) : captures d'écran et
-- fichiers. Métadonnées stockées en jsonb sur la ligne ; fichiers dans un
-- bucket privé dédié. Comme les retours sont des données produit (hors QMS,
-- voir 20260626140000_retours.sql), l'accès au bucket se fait uniquement
-- côté serveur via le client service_role (aucune policy storage exposée).
-- ============================================================================

-- Chaque entrée : { "path": text, "nom": text, "taille": int, "type": text }.
alter table public.retours
  add column pieces_jointes jsonb not null default '[]'::jsonb;

-- Bucket privé : jamais lu directement par le client, seulement via service_role.
insert into storage.buckets (id, name, public)
values ('retours', 'retours', false)
on conflict (id) do nothing;
