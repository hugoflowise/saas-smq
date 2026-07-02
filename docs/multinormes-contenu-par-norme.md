# Multi-normes — cartographie du contenu / format par norme (point B)

But : au-delà des **libellés** (déjà faits : titres, badges, mentions qui s'adaptent
via `normes-libelles.ts` / `PageHeader`), lister page par page ce qui doit **diverger
en structure, champs ou contenu** selon la norme du client (9001 vs MASE), afin de
planifier le chantier métier MASE « chantier après chantier ».

Réf. : [Structure référentiel MASE](../memory) — MASE 2024 = 5 axes, ~267 questions
cotées **B/V/VD** avec points (≠ cotation qualitative 9001), tout décliné sur 3 domaines
**Sécurité / Santé / Environnement**.

## Trois types de divergence

1. **Contenu de référence** : les questions/exigences/checklists elles-mêmes (auto-diag,
   mode audit, exigences d'aide) — 9001 ≠ MASE.
2. **Structure documentaire** : les sections/rubriques d'un document (politique, revue) —
   fixes et calées 9001 aujourd'hui.
3. **Modèle de données** : champs supplémentaires portés par la norme (domaine S/S/E,
   type d'indicateur suivi/résultat, TF/TG, cotation par points, habilitations…).

## Cartographie page par page

| Module | Ce qui diverge pour MASE | Type | Ampleur | Dépend de |
|---|---|---|---|---|
| **Auto-diagnostic** `/conformite` | Aujourd'hui : cotation **qualitative** (conforme/NC…) par chapitre, `referentiel_iso` global (`norme`, `chapitre`, `domaine_iso`). MASE : **267 questions en 5 axes**, chacune avec **points + cotation B/V/VD + neutralisation**, score total et **par axe**. → seeder `referentiel_iso` en `norme='MASE'` **et** nouveau **modèle d'évaluation chiffré** (points obtenus/max, drapeau neutralisée) à côté de la cotation qualitative. | 1 + 3 | **Grosse** | Questions officielles (on les a) ; enum `domaine_iso` à étendre aux 5 axes |
| **Politique** `/strategie/politique` | Sections figées 9001 (présentation, valeurs, engagements, objectifs). MASE §1.2 : politique **SSE couvrant les 3 domaines** S/S/E + **principes essentiels** (identifier/prévenir les risques, personnels formés/aptes/habilités, sous-traitants équivalents, veille & application, amélioration continue), datée + signée + diffusée. | 2 + 3 | Moyenne | Contenu type (Léa) |
| **Objectifs** `/strategie/objectifs` | Objectifs SMART génériques. MASE §1.3 : objectifs **par domaine S/S/E** (couverture des 3 évaluée). Champ `domaine` sur l'objectif. | 3 | Moyenne | — |
| **Indicateurs** `/indicateurs` | KPI génériques. MASE §1.4 : indicateurs **de suivi ET de résultat**, par domaine, dont **TF / TG** (taux de fréquence/gravité), absentéisme, situations dangereuses… Types + indicateurs SSE pré-branchés. | 3 | Moyenne | — |
| **Revue de direction** `/revues/direction` | Structure **§9.3.2 a→f** (entrées) + 3 sorties, 100 % 9001. MASE Axe 5 : **bilan annuel SSE** agrégeant les 4 axes (objectifs, indicateurs, écarts réglementaires, parties intéressées, plan d'actions, remontées terrain, effectifs/**turn-over**, culture SSE, AdR, REx) → sorties évolution objectifs/politique/actions/AdR/organisation. | 2 | Moyenne | Auto-diag + indicateurs SSE |
| **Mode audit** `/mode-audit` | Checklist structurée **clause par clause ISO §4→§10**. MASE : checklist **par axe (1→5)** / questions clés. | 1 | Moyenne (data-driven) | Référentiel MASE |
| **Remontées** `/reclamations` | Types `incident`/`accident` déjà là. MASE Axe 4 : **recueil des faits** (situation dangereuse, presqu'accident, accident, maladie pro, impact env) + **cotation/gravité** + **analyse** (arbre des causes / 5 pourquoi). | 3 | Moyenne | — |
| **Veille** `/veille` | Types `qualite`/`reglementaire`. MASE §1.5.7-8 : veille SSE + **récolement en 4 étapes** (identification → applicabilité → conformité → actions) + **registre des contrôles obligatoires** (vérifs périodiques, échéances) = brique **nouvelle**. | 1 + 3 | Moyenne/grosse | — |
| **Effectif / Compétences** `/effectif` | MASE Axe 2 (central) : **matrice habilitations/formations/aptitudes médicales** avec échéances/alertes, **accueil SSE tracé** + contrôle des connaissances, **tutorat/parrainage**, évaluation culture SSE. | 3 | Grosse | Boond (identité/missions) |
| **Tableau de bord** `/dashboard` | Tuiles 9001 (satisfaction/NPS, NC…). MASE : tuiles **SSE** (TF/TG, situations dangereuses, accueils SSE, habilitations à échéance, AdR à jour…). | 3 | Moyenne | Indicateurs + Axe 4 |
| **Documents / Procédures** | Dispositif documentaire commun (GED). Divergence faible (types de docs SSE éventuels). | 3 | Faible | — |

## Modules **entièrement nouveaux** (Axe 3 — cœur métier MASE, aucun équivalent 9001)

- **Analyse de risques (AdR) par mission/poste** — 1 consultant = 1 AdR, signée, à jour ; méthode d'analyse formalisée (visite préalable).
- **Plan de prévention (PDP)** co-signé client (donnée d'entrée de l'AdR, ne la remplace pas).
- **Préparation de mission** (trame, moyens, modes opératoires, points d'arrêt), check-list exigences site, briefing/mise au travail, fin de tâches.
- **Bilan / REx de fin de mission** (nourrit les AdR suivantes).
- **Gestion du changement** (modification des conditions opératoires), **sélection SSE des sous-traitants**.

## Ordre proposé (chantier après chantier)

1. **Auto-diagnostic MASE noté** — colonne vertébrale de la certif, très déterministe (on a
   les 267 questions). Un client MASE peut s'auto-évaluer tout de suite. → *P1*
2. **Politique SSE + Objectifs/Indicateurs SSE** (Axe 1) — extension de l'existant avec la
   dimension domaine S/S/E + TF/TG. → *P2*
3. **Axe 3 (cœur) : AdR par mission + PDP** — le vrai métier neuf, plus lourd. → *P1 métier*,
   après les deux quick wins.
4. **Remontées SSE + analyse d'événements** (Axe 4) ; **Veille/récolement + contrôles
   obligatoires**. → *P2*
5. **Revue/bilan SSE** (Axe 5), **Mode audit MASE**, **Dashboard SSE**. → *P3*
6. **Effectif/Compétences Axe 2** (matrice habilitations, accueils SSE, tutorat) — gated sur
   **Boond**. → quand les accès Boond arrivent.

Le **DUERP** (déjà sur staging, socle) est le support de l'Axe 3 : à finaliser en parallèle
(chantier déjà suivi séparément).

## Principe d'implémentation

Étendre l'existant (pas de duplication) : ajouter un **champ `domaine`** (S/S/E) là où c'est
pertinent, activer les blocs SSE selon `normes_actives`, réutiliser Actions/Audits/Remontées.
Le contenu propre à MASE (textes d'exigences, sections de politique, questions) est validé
avec **Léa** ; la mécanique se met en place avec le texte 9001 déjà branché.
