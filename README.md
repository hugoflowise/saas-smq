# Flowise — Pilotage SMQ

Outil SaaS multi-tenant de pilotage du **Système de Management de la Qualité** (ISO 9001:2015)
pour les sociétés d'ingénierie et ESN françaises, opéré par Flowise.

Le cahier des charges complet fait foi : voir [`CDC.md`](./CDC.md).

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (primitives Base UI) |
| Lint / format | Biome |
| Forms / validation | React Hook Form + Zod |
| Backend / DB | Supabase (Postgres + RLS, Auth, Storage, Realtime, Edge Functions) — région Frankfurt |
| Éditeur de documents | Tiptap _(Phase 2+)_ |
| Charts KPI | Recharts _(Phase 3)_ |
| Email | Resend _(Phase 6)_ |
| Intégration métier | BoondManager (OAuth 2.0) _(Phase 3)_ |
| Hébergement | Vercel |
| Package manager | pnpm |

> Note : le CDC v1.1 mentionnait Next.js 15 / React 18 / Tailwind 3 ; décision validée
> de partir sur les **dernières versions majeures** (Next 16 / React 19 / Tailwind 4).
> Le CDC sera mis à jour en conséquence.

## Prérequis

- Node.js ≥ 22.9
- pnpm 9 (`corepack enable pnpm`)

## Démarrage

```bash
pnpm install
cp .env.example .env.local   # puis renseigner les valeurs
pnpm dev                      # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm start` | Serveur de production |
| `pnpm lint` | Vérification Biome (lint + format + imports) |
| `pnpm lint:fix` | Correction automatique Biome |
| `pnpm typecheck` | Vérification TypeScript (`tsc --noEmit`) |

## Structure

```
src/
├── app/              # App Router (pages, layouts, API routes)
├── components/ui/    # Composants shadcn/ui (vendor)
└── lib/              # Utilitaires (cn, clients, helpers)
```

## Conventions

Voir CDC §15. En résumé : fichiers en `kebab-case`, composants en `PascalCase`,
Server Components par défaut (`"use client"` seulement si nécessaire), SQL en `snake_case`.
