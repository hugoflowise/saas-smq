# Formulaires personnalisables par client

Permettre à chaque client d'adapter ses formulaires de suivi (suivi consultant,
suivi de prestation) : partir des formulaires standards et **ajouter / supprimer /
réordonner / reformuler** des questions, sans jamais casser les indicateurs.

Ce chantier prépare aussi le **mode hors-ligne** (PWA) : une définition de
formulaire stockée en données peut être chargée sur le poste du BM/dirigeant,
remplie sans réseau, puis synchronisée au retour de connexion.

## Principe : questions « socle » vs « libres »

- **Socle (`verrou: true`)** : alimentent les stats / exports / alertes ou des
  colonnes dénormalisées. Le client peut les **réordonner et reformuler le
  libellé**, mais **pas les supprimer** — leur `key` technique reste figée.
  Certaines portent un `roleStat` (`nps`, `satisfaction`, `alerte`,
  `qsse_conformite`) qui indique l'indicateur alimenté.
- **Libres** : le client ajoute / supprime / modifie à volonté. Stockées dans la
  colonne `reponses` (jsonb), invisibles des indicateurs cœur.

## Modèle de données

Table `formulaire_modeles` (migration `20260630130000_formulaire_modeles.sql`) :

| colonne | rôle |
|---|---|
| `tenant_id`, `type` | `type` ∈ {`suivi_consultant`, `suivi_prestation`} |
| `version` | incrémentée à chaque modif |
| `definition` (jsonb) | tableau de `SectionConfig` (même format que les constantes TS) |
| `actif` | un seul modèle actif par (tenant, type) — index unique partiel |

Colonne `modele_version` sur `suivis_consultant` : version du modèle au moment de
la soumission (null = modèle par défaut TS).

**Stratégie « fallback »** : tant qu'un client n'a rien personnalisé, **aucune
ligne** n'existe dans `formulaire_modeles`, et l'app retombe sur le modèle par
défaut codé en TS. Une ligne n'est créée qu'au **premier** geste de
personnalisation (Phase 2). Avantage : pas de duplication, et l'amélioration du
modèle par défaut profite à tous les clients non personnalisés.

Le résolveur central est `resoudreDefinitionFormulaire()`
(`src/lib/formulaire-modeles.ts`).

## Phasage

- **Phase 1 — Fondation (FAITE)** — _branche `feat/formulaires-personnalisables`,
  appliquée sur la base staging._
  Table + colonne version, type `Champ` étendu (`verrou`/`roleStat`), questions
  socle du suivi consultant marquées, résolveur, et branchement des consommateurs
  (formulaire public, fiche détail, export) sur le résolveur. **Aucun changement
  visible** : sans ligne en base, tout retombe sur le modèle par défaut.
  Périmètre limité au **suivi consultant** (déjà data-driven).

- **Phase 2 — Éditeur de formulaire (client)**
  Écran dans `(tenant)` : liste sections + questions, glisser-déposer pour
  réordonner, ajouter une question (texte, note /5, oui-non, choix multiple,
  NPS…), reformuler un libellé, supprimer (sauf `verrou`). Sauvegarde = nouvelle
  version. Robustesse export/détail : afficher aussi les clés orphelines présentes
  dans `reponses` mais absentes de la définition courante.

- **Phase 3 — Suivi de prestation dans le même moteur**
  Ajouter un type de champ `matrice` (les 6 axes de satisfaction notés), migrer
  `src/lib/suivi-prestation.ts` vers le format `SectionConfig`, brancher le
  résolveur (type `suivi_prestation`) sur le formulaire public, la fiche détail et
  l'export prestation.

- **Phase 4 — Hors-ligne (PWA)**
  Service worker + stockage local (IndexedDB) + file d'envoi automatique au retour
  du réseau, en réutilisant le moteur data-driven. Cible : poste (laptop) du
  BM/dirigeant en clientèle sans wifi. Le groundwork « add-to-home-screen » existe
  déjà (PR #264).
