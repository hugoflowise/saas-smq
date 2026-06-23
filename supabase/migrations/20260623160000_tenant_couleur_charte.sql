-- Couleur principale de la charte graphique du client (format hex, ex. #5b8a9a).
-- Appliquée aux documents générés (en-tête, accents, en-têtes de tableaux).
-- Null => couleur par défaut neutre.
alter table public.tenants add column couleur_charte text;
