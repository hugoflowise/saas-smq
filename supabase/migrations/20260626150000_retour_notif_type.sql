-- Type de notification pour le suivi d'un signalement/suggestion (passage en
-- cours / traité). Notification in-app uniquement (pas d'e-mail).
alter type public.notification_type add value if not exists 'retour_update';
