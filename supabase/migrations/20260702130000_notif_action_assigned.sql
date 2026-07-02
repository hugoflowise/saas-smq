-- ============================================================================
-- Notification : une action a été affectée à un utilisateur (par quelqu'un d'autre)
-- Nouveau type de notification, à l'image de nc_assigned pour les NC.
-- ============================================================================

alter type public.notification_type add value if not exists 'action_assigned';
