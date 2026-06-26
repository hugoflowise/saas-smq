-- ============================================================================
-- Numérotation séquentielle des retours (référence stable du backlog).
-- Chaque retour reçoit un numéro incrémental, attribué à la création et
-- inchangé ensuite, indépendamment de l'ordre d'affichage (tri par statut).
-- ============================================================================

alter table public.retours add column numero integer;

create sequence if not exists public.retours_numero_seq owned by public.retours.numero;

-- Backfill : numérote les retours existants dans l'ordre de création.
with ordered as (
  select id, row_number() over (order by created_at, id) as rn
  from public.retours
)
update public.retours r
set numero = o.rn
from ordered o
where r.id = o.id;

-- La séquence reprend après le dernier numéro déjà attribué.
select setval('public.retours_numero_seq', coalesce((select max(numero) from public.retours), 0));

alter table public.retours alter column numero set default nextval('public.retours_numero_seq');
alter table public.retours alter column numero set not null;

create unique index idx_retours_numero on public.retours (numero);
