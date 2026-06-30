# DUERP — module Document Unique

Module **socle** (obligation légale Code du travail L4121-3 / R4121-1 dès 1 salarié),
distinct du module R&O (`/risques`, ISO 9001 §6.1). Inspiré du DUERP de référence
de Léa (Fortil Sud-Est, indice N / 2024).

## Méthode de cotation (reprise de Fortil)

- **Risque Initial** `Ri = Fréquence (F) × Gravité (G)`
  - **F** ∈ {0, 2, 4, 6, 8} : 0 = aucune exposition · 2 = très improbable (1×/an) ·
    4 = improbable (1×/semestre) · 6 = probable (1×/mois) · 8 = très probable (1×/semaine)
  - **G** ∈ {2, 4, 8, 16} : 2 = légère (sans arrêt) · 4 = sans effet irréversible (avec arrêt) ·
    8 = élevée (incapacité) · 16 = très élevée (mortelle)
- **Risque Résiduel** `Rr = arrondi(Ri ÷ M)`, **M** = niveau de maîtrise ∈ {1..4}
  (1 = aucune/inefficace … 4 = très efficace)
- **Priorité** (depuis Rr) : `Rr ≥ 43 → P1` · `16 ≤ Rr < 43 → P2` · `Rr ≤ 15 → P3`

Implémenté : `Ri`/`Rr` = colonnes générées (`supabase/migrations/...duerp...`),
échelles + priorité dans `src/lib/duerp.ts`.

## Structure de données (livré — fondation + CRUD, PRs #265)

- `duerp_unites_travail` — zones d'étude (agence/bureaux, intervenants sites clients,
  RPS, pénibilité, postes…).
- `duerp_risques` — situation dangereuse, dommages, G/F/Ri, actions existantes, M/Rr,
  action(s) à mettre en place, statut, FK action de prévention.
- `duerp_familles` — catégorisation paramétrable par client (pré-remplie type INRS).

## Reste à faire (lots suivants)

1. **Action de prévention liée** — créer une action du plan (`origine='duerp'`,
   priorité = priorité résiduelle) depuis un risque. Colonne `action_id` prête.
2. **Versions + circuit 3 rôles** — « table des révisions » du DUERP Fortil
   (Indice / Date / Objet / Rédacteur / Vérificateur / Approbateur) → réutiliser
   l'infra documents maîtrisés. Mise à jour annuelle obligatoire (alerte d'échéance).
3. **Export PDF opposable** — calqué sur la structure Fortil :
   page de garde, sommaire, table des révisions, réglementation, abréviations,
   grilles de cotation (initiaux + résiduels), évaluation par zone, **Plan Annuel de
   Prévention des Risques (PAPR)**. Réutiliser `PrintShell` + `DownloadPdfButton`.
4. **Bibliothèque de risques type (proposée à valider)** — le DUERP Fortil contient
   une liste riche de situations dangereuses (bureaux/agence, intervenants sites
   clients, RPS, pénibilité) directement réutilisable comme **seed « proposé à
   valider »** pour réduire la page blanche des nouveaux clients ESN/ingénierie.
   À construire en template (`src/lib/templates/`) puis brancher dans le seed.

## Pénibilité

Le DUERP Fortil traite la pénibilité à part (G=16 par défaut, F=0 « aucune
exposition » → Ri=0), avec une liste de facteurs réglementaires. Modélisable comme
une unité de travail « Pénibilité » dédiée (F=0 autorisé).
