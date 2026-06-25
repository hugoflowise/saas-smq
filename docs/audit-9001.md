# Audit de certifiabilité ISO 9001:2015

**Date :** 2026-06-25
**Périmètre client :** société de **service / conseil** → exclusions légitimes au titre du §4.3 : §8.3 (conception & développement), §7.1.5 (ressources de surveillance et de mesure / métrologie), §8.6 (libération produit au sens industriel).
**Méthode :** confrontation des exigences clause par clause au **code réel** (pages, server actions, schéma Supabase), pas seulement à l'arborescence des routes.

## Verdict

L'application **permet de construire et faire vivre un SMQ 9001 et est globalement certifiable**. La très grande majorité des exigences et des informations documentées obligatoires ont un module dédié et solide (politique, processus, R&O, objectifs, indicateurs, audits internes, NC + actions correctives avec 5 pourquoi, satisfaction/NPS, documents maîtrisés versionnés/signés, fournisseurs).

Il reste **3 vrais manques d'information documentée obligatoire** + **3 manques de structuration** qui, traités, rendent le dossier irréprochable. Aucun n'est un chantier lourd.

## Légende des statuts

- ✅ **Couvert** — exigence satisfaite, preuve disponible
- 🟡 **Partiel / à structurer** — donnée présente mais forme non probante en audit
- 🔴 **Manquant** — pas d'endroit pour produire la preuve

---

## Tableau de synthèse (jugement de criticité audit réelle)

| § | Exigence | Statut | Info documentée exigée ? | Criticité audit |
|---|----------|--------|--------------------------|-----------------|
| 4.1 | Enjeux internes/externes (SWOT/PESTEL) | ✅ | non | — |
| 4.2 | Parties intéressées + attentes | ✅ | non | — |
| **4.3** | **Domaine d'application + exclusions justifiées** | 🔴 | **OUI** | **Élevée** |
| 4.4 | Processus du SMQ (séquence, interactions, ressources) | ✅ | partielle | — |
| 5.1 | Engagement de la direction | ✅ | non | faible |
| 5.2 | Politique qualité | ✅ | OUI | — |
| 5.3 | Rôles, responsabilités, autorités | 🟡 | non | faible |
| 6.1 | Actions face aux risques & opportunités | ✅ | non | — |
| 6.2 | Objectifs qualité + plans | 🟡 | OUI | moyenne |
| **6.3** | **Planification des modifications du SMQ** | 🔴 | non | moyenne |
| 7.1.2 | Ressources humaines | ✅ | non | — |
| **7.2** | **Compétences (preuves)** | 🔴 | **OUI** | **Élevée** |
| 7.3 | Sensibilisation | 🟡 | non | faible |
| 7.4 | Communication | ✅ | non | — |
| 7.5 | Informations documentées (maîtrise, versions) | ✅ | OUI | — |
| 8.1 | Planification & maîtrise opérationnelles | ✅ | partielle | — |
| **8.2.3** | **Revue des exigences avant engagement** | 🟡/🔴 | **OUI** | **moyenne-élevée** |
| 8.3 | Conception & développement | ⬜ Hors périmètre | — | — |
| 8.4 | Maîtrise des prestataires externes | ✅ | OUI | — |
| 8.5 | Maîtrise de la prestation de service | 🟡 | partielle | moyenne |
| 8.6 | Libération | ⬜ Hors périmètre (clôture = 8.5) | — | — |
| 8.7 | Éléments de sortie non conformes | ✅ | OUI | — |
| 9.1.1 | Surveillance & mesure (indicateurs) | ✅ | OUI | — |
| 9.1.2 | Satisfaction client | ✅ | OUI | — |
| 9.1.3 | Analyse & évaluation | 🟡 | partielle | faible |
| 9.2 | Audit interne | ✅ | OUI | — |
| **9.3** | **Revue de direction (entrées/sorties)** | 🟡 | **OUI** | **Élevée** |
| 10.2 | NC & actions correctives | ✅ | OUI | — |
| 10.3 | Amélioration continue | 🟡 | non | faible |

---

## Les manques à traiter, par priorité

### P0 — Informations documentées obligatoires manquantes (un auditeur les réclamera)

**1. §4.3 Domaine d'application du SMQ** 🔴
La norme exige un énoncé documenté du périmètre du SMQ et la **justification des exclusions** (ici §8.3, §7.1.5, §8.6). Aucun endroit dans l'app pour le saisir.
→ *Proposition : page `/parametres` ou `/strategie` « Domaine d'application » : énoncé du périmètre (activités, sites), exclusions + justification, date d'établissement, validation dirigeant. Petit module.*

**2. §7.2 Compétences** 🔴
La norme exige de **conserver les preuves de compétence**. Aujourd'hui : effectif + checklist QSSE (ODM/PDP/visite médicale) mais aucune matrice de compétences, aucun suivi de formation, aucune preuve attachable.
→ *Proposition : module compétences léger — par personne : compétences requises vs acquises, formations suivies (date, organisme), pièce justificative. C'est le manque le plus visible en audit RH.*

**3. §8.2.3 Revue des exigences avant engagement** 🟡/🔴
Pour du conseil, c'est la **revue de la proposition/devis/commande** avant de s'engager (capacité à répondre, exigences claires). Souvent géré hors outil (CRM/devis) — donc **à clarifier avec le client** : si tracé ailleurs, on documente le lien ; sinon, champ minimal de revue d'engagement.

### P1 — Structuration de l'existant (données présentes mais forme non probante)

**4. §9.3 Revue de direction — entrées/sorties structurées** 🟡
Le module existe mais se réduit à 3 champs texte libre (ordre du jour / conclusions / décisions). Or la norme **liste précisément** les entrées (a→f : suivi des actions précédentes, évolution du contexte, performance — satisfaction, objectifs, processus, NC, audits, fournisseurs —, ressources, efficacité des actions face aux risques, opportunités d'amélioration) et les sorties (amélioration, besoins de changement du SMQ, besoins en ressources). Toutes les **données existent déjà** dans l'app (dashboard les agrège).
→ *Proposition forte : pré-remplir la revue de direction à partir des données agrégées (NPS, objectifs, NC, audits, R&O critiques, fournisseurs), avec une trame calée sur §9.3.2 a→f et des sorties qui génèrent des actions liées (`origine = rdd`). C'est le meilleur rapport valeur/effort et un point très regardé en audit.*

**5. §6.2 Objectifs qualité — cohérence avec la politique** 🟡
Manque le lien explicite objectif ↔ politique et la trace « établi par la direction ». Champs légers à ajouter.

**6. §6.3 Planification des modifications du SMQ** 🔴
Aucun mécanisme pour planifier un changement du SMQ de façon maîtrisée (impact, ressources, responsabilités). Pas besoin d'un lourd workflow de change-request : un **registre simple** des modifications planifiées, ou un traitement explicite en revue de direction, suffit à répondre à l'exigence.

### P2 — Confort / robustesse (non bloquant certification)

- §8.5 prestation : critères d'acceptation pré-mission, lien commande→prestation→livrable, signature de réception. Utile mais peut rester hors outil pour un premier audit.
- §5.3 : organigramme / fiches de poste — **non exigés** par la norme (bonne pratique seulement).
- §7.3 : programme de sensibilisation formalisé.
- §9.1.3 : rapport de performance SMQ formel (le dashboard couvre déjà l'analyse).

---

## Faux-positifs écartés (NE PAS coder)

Points remontés par l'analyse automatique mais **non exigés** par ISO 9001:2015 — à ne pas transformer en chantier :

- **Manuel qualité** : supprimé comme obligation depuis la version 2015.
- **Fiches de poste / lettre de mission du RQ / organigramme** : bonnes pratiques, pas des informations documentées exigées.
- **Registre de diffusion / preuve de lecture de la politique** : la norme demande qu'elle soit « disponible et communiquée », pas un accusé de réception nominatif.
- **Plan de destruction documentaire / durée de rétention formalisée** : non exigé par la 9001 (relève du légal/RGPD, pas du SMQ).
- **Base de connaissances dédiée (§7.1.6)** : déjà couvert par la documentation maîtrisée.

---

## Recommandation de séquencement (avant chantier MASE)

1. **§4.3 Domaine d'application** — petit, débloque un point d'audit net.
2. **§9.3 Revue de direction structurée + pré-remplie** — fort impact audit, données déjà disponibles.
3. **§7.2 Compétences** — module léger, manque RH le plus visible.
4. **§6.2 / §6.3** — champs et registre légers.
5. **§8.2.3 / §8.5** — après clarification du fonctionnement réel client (CRM/devis externes ?).

Une fois ces points traités, le socle 9001 est « irréprochable » et constitue une base saine pour brancher le multi-normes (MASE).
