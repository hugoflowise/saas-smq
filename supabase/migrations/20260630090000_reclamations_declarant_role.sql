-- Rôle du déclarant pour une remontée déposée via le formulaire public
-- (business_manager / consultant / autre). Permet à la qualité de tracer
-- l'origine des signalements (BM vs consultant terrain).
alter table public.reclamations
  add column if not exists declarant_role text;

comment on column public.reclamations.declarant_role is
  'Rôle déclaré du déclarant via le formulaire public : business_manager, consultant ou autre.';
