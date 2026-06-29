-- §6.2.2 : une action du plan d'actions peut désormais avoir pour origine
-- un objectif qualité. On ajoute la valeur d'enum dans sa propre migration :
-- « alter type ... add value » ne peut pas être utilisé dans la même
-- transaction que les requêtes qui s'en servent.
alter type public.action_origine add value if not exists 'objectif';
