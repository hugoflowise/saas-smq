-- Clé d'idempotence pour la synchronisation des suivis remplis hors-ligne.
-- Le fichier autonome génère une clé unique par réponse ; à la synchro, une
-- réémission (réseau qui coupe/revient) est ignorée sans créer de doublon.
-- Les colonnes NULL restent distinctes en Postgres, donc les insertions
-- classiques (formulaires publics en ligne) ne sont pas contraintes.

alter table public.suivis_consultant
  add column if not exists idempotency_key text unique;

alter table public.suivis_prestation
  add column if not exists idempotency_key text unique;
