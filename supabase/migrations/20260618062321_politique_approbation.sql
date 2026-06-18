-- Module 3 — champs d'approbation/signature sur la politique (CDC §8.3)
alter table public.politique_qualite
  add column approved_by uuid references public.profiles (id) on delete set null,
  add column approved_at timestamptz,
  add column signature_data jsonb;
