-- Lien vers le texte officiel (Légifrance/JO), cohérent avec ce que fournit
-- l'API : saisissable manuellement et repris depuis les suggestions retenues.
alter table public.veille_reglementaire add column lien text;
