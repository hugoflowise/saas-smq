-- Codification des documents natifs (rédigés dans l'application) pour qu'ils
-- figurent dans la matrice documentaire avec leur code client (ex. DG_SMQ_004,
-- PR_SMQ_001), sans avoir à les ressaisir à la main. Les fiches d'identité de
-- processus utilisent déjà `processus.fiche_reference`.
alter table public.politique_qualite
  add column if not exists code text;

alter table public.procedures
  add column if not exists code text;

comment on column public.politique_qualite.code is
  'Code documentaire affiché dans la matrice (liste maîtresse), ex. DG_SMQ_004.';
comment on column public.procedures.code is
  'Code documentaire affiché dans la matrice (liste maîtresse), ex. PR_SMQ_001.';
