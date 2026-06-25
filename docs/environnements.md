# Environnements (prod & staging)

Deux environnements Supabase + Vercel, pour tester avant de livrer aux clients.

## Vue d'ensemble

| | **Staging** (test) | **Production** (clients) |
|---|---|---|
| Projet Supabase | `flowise-staging` — ref `bsiwwzfundeueiirufmn` | `flowise-prod`* — ref `dtrqxakbsjlgmmmbhkll` |
| Région | eu-central-1 | eu-central-1 |
| URL Supabase | `https://bsiwwzfundeueiirufmn.supabase.co` | `https://dtrqxakbsjlgmmmbhkll.supabase.co` |
| App Vercel | environnement **Preview** (URL de preview par PR) | environnement **Production** (`app.flowise.fr`) |
| Données | fictives (jamais de données clients — RGPD) | réelles |

\* Le projet de prod s'appelle encore `saas-smq` côté Supabase — à renommer en `flowise-prod` dans le dashboard (cosmétique, le ref ne change pas).

## Workflow de migration

```
1. écrire la migration dans supabase/migrations/
2. pnpm db:push:staging      # applique sur staging
3. tester sur l'URL de preview de la PR
4. merge la PR
5. pnpm db:push:prod         # applique sur prod
```

- `pnpm db:push:staging` cible le staging via son URL DB (`STAGING_DB_URL` dans `.env.staging`) — ne touche jamais au projet « lié ».
- `pnpm db:push:prod` cible la prod (projet lié, `.env.local`).
- Les secrets vivent dans `.env.local` (prod) et `.env.staging` (staging), tous deux **gitignorés**.

## Configuration restante (dashboard — à faire une fois)

### 1. Clés API staging → Vercel (env « Preview »)
Récupérer les clés sur :
`https://supabase.com/dashboard/project/bsiwwzfundeueiirufmn/settings/api`

Puis dans **Vercel → Settings → Environment Variables**, créer ces variables **scoping = Preview uniquement** :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bsiwwzfundeueiirufmn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé *publishable* du staging |
| `SUPABASE_SERVICE_ROLE_KEY` | clé *secret* du staging |
| `NEXT_PUBLIC_APP_URL` | l'URL de preview (ou un domaine `staging.flowise.fr` si tu en crées un) |

> Les variables de l'environnement **Production** restent inchangées (prod).
> Reporter aussi les clés dans `.env.staging` (champs laissés vides) pour le dev local.

### 2. Hook de rôle JWT sur staging (indispensable)
La claim `user_role` dépend d'un hook auth. La fonction existe déjà (migrations), il faut l'**activer** :
`Dashboard staging → Authentication → Hooks → Custom Access Token → fonction `custom_access_token_hook` → Enable`

### 3. URLs d'authentification staging
`Dashboard staging → Authentication → URL Configuration` :
- **Site URL** = l'URL de preview / staging
- **Redirect URLs** = `<url-staging>/**`

(sinon les liens magic link / reset de mot de passe rebondiront — cf. mémoire `auth-callback-cookies`).

### 4. (Optionnel) Renommer la prod
`Dashboard prod → Settings → General → Project name` : `saas-smq` → `flowise-prod`.

## Données de test
Staging démarre **vide** (schéma seul). Crée un client de test via l'app sur l'URL de preview (le provisioning auto crée 13 processus + 80 actions). Promouvoir un compte en `admin_flowise` se fait en base si besoin (cf. mémoire).
