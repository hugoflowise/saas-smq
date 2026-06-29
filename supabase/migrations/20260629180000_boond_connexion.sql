-- ============================================================================
-- Intégration BoondManager — stockage des identifiants de connexion par tenant
-- ----------------------------------------------------------------------------
-- Migration ADDITIVE et INERTE : aucune donnée n'est écrite, aucun comportement
-- existant n'est modifié. Elle complète les colonnes déjà présentes sur
-- `tenants` (boond_account_id, boond_oauth_token) pour le mode d'authentification
-- « App-JWT » (recommandé en SaaS, voir docs/integration-boond.md).
--
-- Modèle multi-tenant : chaque client Flowise = un compte BoondManager distinct.
-- On stocke SES identifiants ici → tout appel API est scoppé à son compte
-- (isolation native des données).
--
-- ⚠️ SÉCURITÉ — À FAIRE AVANT MISE EN SERVICE : chiffrer boond_user_token /
-- boond_app_token / boond_app_key (et l'existant boond_oauth_token) via Supabase
-- Vault. Ces secrets ne doivent JAMAIS être exposés côté client : lecture par
-- createAdminClient() côté serveur uniquement (jamais sélectionnés dans une page
-- ou action renvoyée au navigateur).
-- ============================================================================

-- Mode d'authentification retenu pour le tenant.
create type public.boond_auth_mode as enum ('app', 'client');

-- État de synchronisation (alimente la future UI « Paramètres → Intégration »).
create type public.boond_sync_status as enum ('non_connecte', 'connecte', 'erreur');

alter table public.tenants
  -- Mode d'auth choisi (null tant que non connecté).
  add column boond_auth_mode public.boond_auth_mode,
  -- Jeton du compte BoondManager (réglages utilisateur > sécurité). À CHIFFRER.
  add column boond_user_token text,
  -- Jeton fourni par Boond à l'installation de l'app (mode App). À CHIFFRER.
  add column boond_app_token text,
  -- Clé de l'app (admin client > apps), clé de signature HMAC du JWT. À CHIFFRER.
  add column boond_app_key text,
  -- Horodatage de connexion réussie.
  add column boond_connected_at timestamptz,
  -- Dernière synchronisation aboutie.
  add column boond_last_sync_at timestamptz,
  -- État courant de la connexion (défaut : non connecté).
  add column boond_sync_status public.boond_sync_status not null default 'non_connecte',
  -- Dernier message d'erreur de synchro (diagnostic ; lié au type de
  -- notification boond_sync_error déjà existant).
  add column boond_last_sync_error text;

comment on column public.tenants.boond_user_token is
  'Jeton compte BoondManager. À chiffrer (Supabase Vault) avant mise en service.';
comment on column public.tenants.boond_app_token is
  'Jeton app BoondManager (mode App). À chiffrer (Supabase Vault) avant mise en service.';
comment on column public.tenants.boond_app_key is
  'Clé app BoondManager (signature JWT HMAC). À chiffrer (Supabase Vault) avant mise en service.';
