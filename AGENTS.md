<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Conventions & briques partagées

Avant d'écrire du nouveau code, réutilise ces briques (évite de recopier les patterns) :

- **Server actions** : renvoient toujours `ActionResult` ou `CreateResult` (`src/lib/actions/types.ts`).
  Le client teste `result.ok` (succès) sinon affiche `result.error` via un toast.
- **Dialogues de formulaire** : utiliser le hook `useDialogForm()` (`src/lib/hooks/use-dialog-form.ts`)
  pour l'ouverture, l'état « en cours », le toast et `router.refresh()`. Ne garder dans le
  composant que l'extraction du `FormData` et le choix créer/modifier. Exemple de référence :
  `src/app/(tenant)/veille/veille-dialog.tsx`.
- **`<select>` natifs** : importer la classe depuis `src/lib/ui-classes.ts`
  (`SELECT_CLASS`, `_INLINE`, `_FILTER`, `_COMPACT`) — ne pas redéfinir de classe en dur.
- **Tuiles de statistiques** : composant `StatTiles` (`src/components/stat-tiles.tsx`).
- **Dates** : `todayISO()` / `dateOffsetISO(jours)` et `formatDate()` (`src/lib/format.ts`).
- **Bascule Liste/Kanban** : `ViewToggle` (`src/components/view-toggle.tsx`).
- **En-tête de page** : composant `PageHeader` (`src/components/page-header.tsx`).
- **Multi-tenant** : toute action/page passe par `getTenantContext()` (`src/lib/tenant-context.ts`)
  et filtre sur `effectiveTenantId`. Le rôle `auditeur` est en lecture seule (trigger DB).

Qualité : `pnpm lint` (Biome), `pnpm exec tsc --noEmit`, `pnpm test` (Vitest) et `pnpm build`
doivent tous passer avant de merger (la CI les rejoue). Les commentaires sont en français.
