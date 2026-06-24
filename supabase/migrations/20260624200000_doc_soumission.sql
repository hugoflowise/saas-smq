-- ============================================================================
-- Soumission signée des documents maîtrisés : on enregistre qui soumet à
-- approbation et quand, comme pour la fiche d'identité. Le rédacteur signe
-- à la soumission (sa signature s'affiche ensuite sur le document).
-- ============================================================================

alter table public.politique_qualite
  add column soumis_par uuid references public.profiles (id) on delete set null,
  add column soumis_le timestamptz;

alter table public.procedures
  add column soumis_par uuid references public.profiles (id) on delete set null,
  add column soumis_le timestamptz;
