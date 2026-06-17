-- ============================================================================
-- Phase 1 — Schéma d'infrastructure multi-tenant
-- Tables : tenants, profiles, audit_log, notifications
-- + modèle d'auth (claims JWT tenant_id / user_role) + RLS
-- Réf. CDC §5.2, §5.3, §6.1, §7.1
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.tenant_formule as enum ('Essentiel', 'Tandem', 'Premium');
create type public.tenant_statut as enum ('Actif', 'Suspendu', 'Résilié');
create type public.effectif_tranche as enum ('1-9', '10-49', '50-99', '100-299', '300+');
create type public.secteur_activite as enum ('SI', 'ESN', 'AT', 'autre');
create type public.user_role as enum ('admin_flowise', 'dirigeant', 'manager', 'auditeur');
create type public.notification_type as enum (
  'approval_request', 'approval_granted', 'deadline_action', 'audit_upcoming',
  'kpi_alert', 'nc_assigned', 'nc_overdue', 'rdd_due', 'boond_sync_error',
  'policy_review_due', 'mention'
);

-- ---------------------------------------------------------------------------
-- Trigger générique : maintien de updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Table : tenants (clients Flowise)
-- ---------------------------------------------------------------------------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  nom_societe text not null,
  effectif_tranche public.effectif_tranche,
  secteur public.secteur_activite,
  date_souscription date,
  formule public.tenant_formule not null default 'Essentiel',
  statut public.tenant_statut not null default 'Actif',
  boond_account_id text,
  boond_oauth_token text, -- sera chiffré ultérieurement (Supabase Vault)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table : profiles (1-1 avec auth.users)
-- tenant_id null => admin Flowise (accès cross-tenant)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  tenant_id uuid references public.tenants (id) on delete set null,
  role public.user_role not null default 'dirigeant',
  avatar_url text,
  last_seen timestamptz,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_tenant_id on public.profiles (tenant_id);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table : audit_log (traçabilité des actions sensibles)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null, -- 'create' | 'update' | 'delete' | 'sign' ...
  entity_type text not null, -- 'procedure' | 'nc' ...
  entity_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_tenant_created on public.audit_log (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Table : notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient
  on public.notifications (recipient_user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers RLS (lecture des claims JWT — pas d'accès à profiles => pas de récursion)
-- ---------------------------------------------------------------------------
create or replace function public.jwt_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
$$;

create or replace function public.is_admin_flowise()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'user_role', '') = 'admin_flowise';
$$;

-- ---------------------------------------------------------------------------
-- Custom Access Token Hook : injecte tenant_id + user_role dans le JWT
-- (activé dans config.toml : [auth.hook.custom_access_token])
-- ---------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_tenant_id uuid;
  v_role public.user_role;
begin
  select tenant_id, role into v_tenant_id, v_role
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  if v_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role::text));
  end if;

  if v_tenant_id is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
  else
    claims := jsonb_set(claims, '{tenant_id}', 'null'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Le hook s'exécute sous le rôle supabase_auth_admin : droits nécessaires
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.profiles to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Provisioning automatique du profil à l'inscription
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS — isolation par tenant + accès cross-tenant pour admin Flowise (CDC §5.3)
-- ============================================================================

-- ---- tenants ----
alter table public.tenants enable row level security;

create policy tenants_select on public.tenants
  for select to authenticated
  using (public.is_admin_flowise() or id = public.jwt_tenant_id());

create policy tenants_admin_write on public.tenants
  for all to authenticated
  using (public.is_admin_flowise())
  with check (public.is_admin_flowise());

-- ---- profiles ----
alter table public.profiles enable row level security;

-- Le hook d'auth (supabase_auth_admin) doit pouvoir lire les profils
create policy profiles_auth_admin_read on public.profiles
  for select to supabase_auth_admin
  using (true);

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin_flowise()
    or tenant_id = public.jwt_tenant_id()
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin_flowise())
  with check (id = auth.uid() or public.is_admin_flowise());

-- ---- audit_log ----
alter table public.audit_log enable row level security;

create policy audit_select on public.audit_log
  for select to authenticated
  using (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

create policy audit_insert on public.audit_log
  for insert to authenticated
  with check (public.is_admin_flowise() or tenant_id = public.jwt_tenant_id());

-- ---- notifications ----
alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (recipient_user_id = auth.uid() or public.is_admin_flowise());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());
