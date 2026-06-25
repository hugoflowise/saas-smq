-- Oblige à définir un mot de passe avant d'accéder à l'application.
-- Posé à true lors d'une invitation ou d'une réinitialisation (la session est
-- alors ouverte par le lien e-mail) ; remis à false dès que l'utilisateur a
-- défini son mot de passe. Tant que true, l'app redirige vers /bienvenue.
alter table public.profiles
  add column if not exists must_set_password boolean not null default false;

comment on column public.profiles.must_set_password is
  'Si vrai, l''utilisateur doit définir un mot de passe (/bienvenue) avant d''accéder à l''app. Posé par invitation/réinitialisation, levé après définition.';
