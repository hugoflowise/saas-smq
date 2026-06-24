-- ============================================================================
-- Signature manuscrite réutilisable par utilisateur : enregistrée une fois
-- (dessin ou image importée), apposée sur les documents qu'il signe. Stockée
-- en data URL (image PNG/JPEG en base64) directement dans le profil.
-- La valeur juridique reste portée par la ré-authentification (mot de passe) +
-- l'horodatage + la traçabilité au moment de la signature ; l'image n'est que
-- la représentation visuelle.
-- ============================================================================

alter table public.profiles
  add column signature_image text;
