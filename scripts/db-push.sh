#!/usr/bin/env bash
# Applique les migrations Supabase sur un environnement explicite.
#   pnpm db:push:staging  → projet flowise-staging (via STAGING_DB_URL dans .env.staging)
#   pnpm db:push:prod     → projet flowise-prod (projet lié, mot de passe dans .env.local)
#
# Le staging passe par --db-url : il ne touche jamais au projet « lié » (prod),
# donc aucun risque de se tromper de cible.
set -euo pipefail

TARGET="${1:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

case "$TARGET" in
  staging)
    [ -f .env.staging ] || { echo "❌ .env.staging introuvable."; exit 1; }
    set -a; source .env.staging; set +a
    [ -n "${STAGING_DB_URL:-}" ] || { echo "❌ STAGING_DB_URL manquant dans .env.staging."; exit 1; }
    echo "→ Push des migrations sur STAGING (flowise-staging)…"
    pnpm exec supabase db push --db-url "$STAGING_DB_URL"
    ;;
  prod)
    [ -f .env.local ] || { echo "❌ .env.local introuvable."; exit 1; }
    set -a; source .env.local; set +a
    echo "⚠️  Cible : PRODUCTION (flowise-prod, données clients réelles)."
    pnpm exec supabase db push
    ;;
  *)
    echo "Usage: pnpm db:push:staging | pnpm db:push:prod"
    exit 1
    ;;
esac
