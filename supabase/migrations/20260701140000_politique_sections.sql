-- ============================================================================
-- Politique qualité : rubriques structurées (sections à compléter)
-- ----------------------------------------------------------------------------
-- Sur le modèle des procédures structurées, la politique qualité est découpée en
-- sections standard à compléter (présentation/périmètre, valeurs, ambition des
-- engagements, objectifs, engagement de la direction). La section « Nos
-- engagements » liste en plus les engagements structurés (table
-- politique_engagements). Le contenu libre (colonne `contenu`) reste disponible.
-- ============================================================================

alter table public.politique_qualite
  add column if not exists presentation text,
  add column if not exists valeurs text,
  add column if not exists engagements_intro text,
  add column if not exists objectifs_texte text,
  add column if not exists engagement_direction text;

comment on column public.politique_qualite.presentation is
  'Présentation de la société et périmètre d''application de la politique.';
comment on column public.politique_qualite.valeurs is 'Nos valeurs (une par ligne).';
comment on column public.politique_qualite.engagements_intro is
  'Texte d''introduction de la section « Nos engagements » (ambition).';
comment on column public.politique_qualite.objectifs_texte is 'Nos objectifs qualité (texte).';
comment on column public.politique_qualite.engagement_direction is
  'Engagement de la direction (une action par ligne).';
