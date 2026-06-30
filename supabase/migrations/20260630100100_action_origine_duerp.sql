-- Une action du plan d'actions peut avoir pour origine un risque du DUERP
-- (action de prévention). Valeur d'enum ajoutée dans sa propre migration :
-- « alter type ... add value » ne peut pas être utilisé dans la même
-- transaction que les requêtes qui s'en servent.
alter type public.action_origine add value if not exists 'duerp';
