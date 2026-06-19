-- ============================================================================
-- Grille d'audit : questions / constats par audit (ISO 9001 §9.2)
-- ============================================================================

create table public.audit_questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  audit_id uuid not null references public.audits_internes (id) on delete cascade,
  ordre integer not null default 0,
  reference_iso text,
  question text not null,
  reponse public.cotation_conformite not null default 'non_evalue',
  constat text,
  created_at timestamptz not null default now()
);
create index idx_audit_questions_audit on public.audit_questions (audit_id, ordre);

alter table public.audit_questions enable row level security;

create policy audit_questions_select on public.audit_questions for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy audit_questions_insert on public.audit_questions for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy audit_questions_update on public.audit_questions for update to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
create policy audit_questions_delete on public.audit_questions for delete to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());
