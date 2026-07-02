-- ============================================================================
-- Rattrapage #82 : les actions déjà rattachées à un objectif qualité doivent
-- porter l'origine « objectif » (elles avaient pu rester en « demarrage_smq »
-- ou « manuelle »). Le lien reste porté par objectif_id ; on aligne l'origine.
-- ============================================================================

update public.actions
set origine = 'objectif'
where objectif_id is not null
  and origine <> 'objectif'
  and deleted_at is null;
