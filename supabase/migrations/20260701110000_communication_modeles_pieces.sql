-- ============================================================================
-- Pièces jointes des modèles de communication
-- ----------------------------------------------------------------------------
-- L'envoi se fait par lien mailto (texte brut) : impossible d'y embarquer un
-- fichier. On permet donc de joindre une PJ au modèle, que l'utilisateur
-- télécharge au moment de l'envoi pour l'ajouter manuellement à son e-mail.
-- Métadonnées en jsonb sur la ligne, fichiers dans un bucket privé dédié
-- (accès uniquement côté serveur via service_role).
-- ============================================================================

-- Chaque entrée : { "path": text, "nom": text, "taille": int, "type": text }.
alter table public.communication_modeles
  add column pieces_jointes jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('communications', 'communications', false)
on conflict (id) do nothing;
