-- ============================================================================
-- Cycle de certification : lier chaque jalon à un audit réel + audit interne
-- ----------------------------------------------------------------------------
-- Le générateur de cycle crée désormais, pour chaque audit externe
-- (certification / surveillance / renouvellement), un audit interne planifié
-- 2 mois avant. Chaque jalon pointe sur l'audit correspondant (table
-- audits_internes) pour que tout soit lié : le bouton « Voir l'audit » ouvre
-- l'audit, qui apparaît aussi dans le module Audits.
-- ============================================================================

-- Nouveau type de jalon : audit interne (remplace « audit blanc » dans le cycle).
alter type public.jalon_type add value if not exists 'audit_interne';

-- Lien jalon -> audit. on delete set null : supprimer l'audit ne casse pas le
-- jalon (le lien retombe simplement à « non rattaché »).
alter table public.jalons_certification
  add column if not exists audit_id uuid references public.audits_internes (id) on delete set null;

create index if not exists idx_jalons_audit on public.jalons_certification (audit_id);
