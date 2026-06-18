# Benchmark — « coengi QHSE » (Clément Oustry) vs Flowise Pilotage SMQ

> Analyse du logiciel présenté par l'alternant qualité de Coengi (réunion du 18/06/2026 avec
> Léa Mathieu), à partir du transcript + 112 captures d'écran.
> Objectif : identifier ce qu'il a qu'on n'a pas, ce qu'il fait mieux, et ce qu'on devrait intégrer.

## 0. Avertissement de cadrage (important)

Avant de comparer, deux différences **structurantes** :

1. **Son outil n'est pas un produit.** Il le dit explicitement : *« il tourne sur mon PC, c'est pas
   sur un site internet… il y a que moi qui ai accès »*. Pas d'hébergement, pas d'authentification,
   pas de multi-utilisateur, sauvegarde manuelle sur OneDrive. **Notre produit est un SaaS
   multi-tenant vendable** (auth, RLS, isolation par client, hébergé). C'est notre raison d'être —
   il n'a rien de tout ça (il dit que la sécurité/hébergement est « un gros travail » pas fait).

2. **Son périmètre est QHSE complet + RH + RGPD + juridique**, mono-société (Coengi Group et ses
   agences). Le nôtre est **SMQ ISO 9001 pur**, multi-client. Une grande partie de ses modules
   (Santé & Sécurité, EPI, formations, habilitations, visites médicales, SPST, DUERP, annuaire
   collaborateurs, RGPD, agences juridiques, import Boond RH) sont **hors de notre périmètre CDC**
   et très spécifiques à Coengi. On les note mais on ne les copie pas aveuglément.

Conclusion : on compare surtout sur le **cœur SMQ ISO 9001**, là où on est tous les deux.

> ⚠️ **Vision produit** : la cible est un SaaS de pilotage qualité **multi-normes** (ISO 9001
> d'abord, puis MASE, CEFRI, ISO 14001…), avec des **modules débloqués selon les normes souscrites**
> par chaque client. Donc ce qui est noté « hors scope » plus bas est en réalité **« plus tard /
> autre norme »**, pas « jamais » : le QHSE (santé-sécurité, environnement…) redeviendra pertinent
> quand on adressera MASE / ISO 14001. On le garde en réserve, on ne le jette pas.

---

## 1. Ce qu'il a et qu'on n'a pas (pertinent SMQ)

| # | Fonctionnalité | Description | Pertinent pour nous ? |
|---|----------------|-------------|------------------------|
| A1 | **Pédagogie ISO inline** | Chaque module affiche sa **clause ISO** (« Satisfaction client — §9.1.2 », « Communications — §7.4 ») + encarts d'aide expliquant la méthode (SMART, 5 Pourquoi…). | ⭐ Oui — énorme pour nos clients non-experts |
| A2 | **Mode audit / Mode présentation** | Bouton « Mode audit » + « Présenter audit ISO » : vue épurée présentable à l'auditeur. | ⭐ Oui — différenciant |
| A3 | **Communications QHSE (§7.4)** | Module dédié : planifier communications internes/externes (sujet, audience, canal, statut, retard). | Oui — exigence ISO qu'on n'a pas |
| A4 | **Calendrier = timeline du cycle de certification** | Frise avec jalons (audit blanc → certif), chaque jalon relie ses NC au plan d'actions. | Oui — vue stratégique forte |
| A5 | **Programme d'audit « 1 clic »** | Génère le programme annuel d'audit (1 ligne par processus) depuis la cartographie. | Oui — automatisation maligne |
| A6 | **Grille d'audit (questionnaire)** | Liste de questions par audit, réponses → écarts → actions. | Oui — complète notre module audits |
| A7 | **Revue/alerte par processus** | Date dernière/prochaine revue par processus + alerte « à réviser ≤60j ». | Oui — lié aux revues |
| A8 | **SWOT visuel + enjeux par criticité** | Matrice SWOT 4 quadrants, vue Kanban « enjeux mineur/significatif/critique » par IPR. | Partiel — on a le SWOT en texte, pas la vue |
| A9 | **Risque brut → résiduel** | Cotation à 3 facteurs (Fréquence × Gravité × **Maîtrise**), distinction risque brut vs résiduel. | Oui — on cote en 2 facteurs |
| A10 | **GED / matrice documentaire** | Bibliothèque de TOUS les documents (pas que politique/procédures) : version, propriétaire, péremption, aperçu PDF, codification. | Oui, à terme — §7.5 |
| A11 | **Journal d'audit (« Main courante »)** | Historique horodaté de toutes les actions, avec **annulation** par entrée. | Bonus — on a déjà la table audit_log, pas l'écran |
| A12 | **Templates .docx (publipostage)** | Upload de modèles Word à placeholders, remplis automatiquement → .docx prêt à signer. | Plus tard — productivité |

## 2. Ce qu'il a MIEUX fait (modules qu'on a tous les deux)

| # | Sujet | Lui | Nous (actuel) | Écart |
|---|-------|-----|----------------|-------|
| B1 | **Plan d'actions** | « Colonne vertébrale » : source, **§ ISO**, **cotation** (conforme / NC mineure / majeure), **constat**, **cause fondamentale**, action corrective/préventive, date prévue **vs** effective, **recommandation** ; filtres pré-construits (en retard, NC majeures, P1, soldé) ; mode « Présenter audit ». | Origine, réf. ISO, dates prévue/effective, priorité. Cause fondamentale uniquement côté NC. | Enrichir les champs + filtres + cotation |
| B2 | **Objectifs qualité** | Suivi de **progression** : valeur actuelle vs cible, **barre de progression**, % d'atteinte global, processus pilote, **sens** (hausse/baisse), unité. | Intitulé, cible (texte), échéance, statut, booléen SMART. | Notre module est trop statique |
| B3 | **Cartographie processus** | Schéma **pyramidal** management / réalisation / support + flux Clients (entrée/sortie), export PDF/Excel, soigné. | Cartographie plus simple. | Visuel à améliorer |
| B4 | **Fiche processus** | Objectif + KPI + risques + documents associés + **revues planifiées** + pilote, dans une fiche unifiée. | Fiche détail correcte, sans planning de revue. | Ajouter les revues/alertes |
| B5 | **Risques** | Heatmap probabilité×gravité avec compteurs, IPR moyen/max, risques par processus, brut/résiduel. | Matrice criticité + fiche détail + actions de traitement (récent). | Combler brut/résiduel + vue enjeux |
| B6 | **Satisfaction client** | NPS global, évolution par trimestre, top clients, réclamations — dérivé des suivis de projet. | Module placeholder. | À construire (cf. méthode Léa) |

## 3. Hors périmètre SMQ (QHSE / RH / RGPD — spécifique Coengi)

À **noter seulement**. Ce serait une extension « QHSE complet » si un jour on élargit le CDC, mais
ce n'est pas du SMQ ISO 9001 et c'est très lié au métier ESN multi-pays de Coengi :

- **Santé & Sécurité au travail** : registre incidents, **pyramide de Bird**, taux fréquence/gravité
  (TF/TG), **analyse d'accident en 8 étapes** (5 Pourquoi / Ishikawa / arbre des causes / Bow-Tie),
  REX, arbre des causes graphique. *(Module très abouti chez lui — mais c'est de l'ISO 45001.)*
- **RH / sécurité** : EPI (avec **OCR de factures** + fiche de remise PDF), habilitations,
  formations (référentiel réglementaire multi-pays), visites médicales, plans de prévention,
  ordres de mission, accueils sécurité, **SPST** (déclarations service de santé), **DUERP**.
- **Annuaire** : collaborateurs « Vision 360° », clients, fournisseurs, **import Boond Manager**
  (synchro RH avec règles de priorité, soft-delete, rollback), détection auto de clients orphelins.
- **RGPD** : registres (traitements/violations/demandes), arbres décisionnels par article.
- **Agences / entités juridiques** (SIRET, KBIS, certificats incendie…), multi-pays.
- **Productivité** : mails type + fusion + ouverture Outlook, templates .docx.

> Décision proposée : **on reste SMQ ISO 9001**. On ne part pas sur le QHSE/RH.

## 4. Ce qu'on fait MIEUX / nos atouts (à ne pas perdre de vue)

- **Vrai SaaS multi-tenant** hébergé, sécurisé, isolation par client (RLS). Lui = local mono-user.
  → **C'est vendable. Lui non.** (Il dit lui-même vouloir « vendre le logiciel » un jour, mais tout
  est à refaire côté hébergement/sécurité/multi-client.)
- **Documents maîtrisés** avec **signature électronique** + snapshots de version + workflow
  brouillon→approuvé→publié. Lui a du versioning mais **pas le circuit rédacteur/vérificateur/
  approbateur** — que Léa lui dit justement d'ajouter (on doit l'avoir proprement, cf. R-doc).
- **Registre des parties intéressées** : on l'a, **lui ne l'a pas** — et Léa précise que son absence
  = **non-conformité majeure** (§4.2). Atout net.
- **Notifications in-app**, **plan d'actions multi-vues** (liste/Kanban/calendrier).

## 5. Conseils ISO de Léa (experte) — transverses, à intégrer côté produit

Léa (notre side) donne des consignes qui valent pour **tous nos clients**, pas que Coengi :

1. **Plan d'actions = source unique** avec une colonne « origine » pour filtrer (on l'a ✓).
2. **Parties intéressées** : registre obligatoire (interne + externe : État, médias, fournisseurs,
   partenaires…). Y inclure **banque, mutuelle** (oubli classique = remarque d'audit).
3. **Réclamations** : inclure les **arrêts prématurés de mission** ; les détecter via les suivis de
   projet ; analyser les causes ; tout verser au plan d'actions.
4. **Satisfaction** : exploiter les **suivis de projet/prestation** (NPS, KPI) ; viser le « 1 %
   insatisfait », pas le 99 % content.
5. **Revue de direction** : analyser la **performance des processus** (objectif → résultat → écart →
   action si écart). Tableau processus × indicateurs × cible × résultat.
6. **Objectifs** : faits par les **pilotes de processus**, validés par la direction, revus en revue
   de processus puis de direction. Le « document annexe objectifs » = le tableau de bord
   objectifs/indicateurs par processus.
7. **Procédures** : tableau de révision avec **version / date / modifications** + **3 rôles
   distincts** (rédacteur, vérificateur, approbateur).
8. **Maîtrise documentaire** : enregistrer un document à **un seul endroit** (éviter les copies
   désynchronisées) ; codifier les documents du système (pas les enregistrements opérationnels).
9. **Multi-certification** possible pour un client avec plusieurs agences (un seul système, audit
   par échantillonnage) — pertinent si on gère le multi-entités intra-client un jour.

## 6. Recommandations priorisées (roadmap proposée)

Légende effort : **S** = petit (≤1 j), **M** = moyen (2-4 j), **L** = gros (1 sem+).

### 🟢 P1 — À faire maintenant (cœur ISO, fort impact, effort maîtrisé)

| Réf | Action | Effort | Pourquoi |
|-----|--------|--------|----------|
| R1 | **Pédagogie ISO inline** : afficher la clause + un encart d'aide sur chaque module | S | Quasi gratuit, gros effet « pro » + rassure les clients non-experts (A1) |
| R2 | **Enrichir le plan d'actions** : champ constat, cause fondamentale (généralisée), cotation (conforme/NC mineure/majeure), recommandation + filtres pré-construits | M | C'est la colonne vertébrale du SMQ (B1) |
| R3 | **Objectifs : suivi de progression** (valeur actuelle vs cible, barre, % global, processus pilote, sens) | M | Exigence §6.2, notre module est trop statique (B2) |
| R4 | **Procédures : tableau de révision + 3 rôles** (rédacteur/vérificateur/approbateur) | S | Léa le signale comme requis ; on a déjà le socle docs maîtrisés |
| R5 | **Revues/alertes par processus** (dernière/prochaine revue + alerte ≤60j) | S-M | Alimente la revue de direction (A7/B4) |

### 🟡 P2 — Ensuite (haute valeur, effort moyen)

| Réf | Action | Effort | Pourquoi |
|-----|--------|--------|----------|
| R6 | **Mode audit / présentation** : vue épurée présentable à l'auditeur | M | Différenciant produit (A2) |
| R7 | **Risques : matrice heatmap + risque brut/résiduel + vue enjeux par criticité** | M | Maturité du module risques (A8/A9/B5) |
| R8 | **Module Communications (§7.4)** | S-M | Exigence ISO manquante (A3) |
| R9 | **Calendrier = timeline cycle de certification** avec jalons → plan d'actions | M | Vue stratégique (A4) |
| R10 | **Audits : grille de questions + programme annuel « 1 clic/processus »** | M | Complète le module (A5/A6) |
| R11 | **Satisfaction client** : NPS, tendances, top clients (méthode suivis de projet) | M | Module aujourd'hui vide (B6) — partiellement bloqué sur la source de données |
| R12 | **Évaluation des fournisseurs (§8.4)** : registre + criticité + évaluation | M | Vérifier la couverture actuelle via parties prenantes |

### 🔵 P3 — Plus tard (gros chantier ou valeur moindre)

| Réf | Action | Effort | Pourquoi |
|-----|--------|--------|----------|
| R13 | **GED / matrice documentaire** générale (tous docs, codification, péremption) | L | §7.5 complet (A10) |
| R14 | **Main courante** : écran de journal d'audit consultable (+ annulation) | M | On a déjà la donnée (audit_log) (A11) |
| R15 | **Multi-entités intra-tenant** (client multi-agences, multi-certif) | L | Si demande client (cf. conseil Léa #9) |

### ⚪ Hors scope (décision : on ne fait pas, sauf changement de CDC)
QHSE/SST, EPI, formations, habilitations, visites médicales, SPST, DUERP, annuaire RH/Vision 360,
import Boond RH, RGPD, agences juridiques, publipostage .docx / mails Outlook.

---

## 7. Synthèse en une phrase

Son outil est un **couteau suisse QHSE mono-poste très complet et bien pensé**, riche d'idées
d'**ergonomie** (pédagogie ISO inline, mode audit, tout-est-lié, automatisations « 1 clic ») et de
**profondeur métier** (plan d'actions 8D, objectifs à progression, risques brut/résiduel) dont on
doit s'inspirer ; mais c'est un **prototype local non vendable**, là où nous avons déjà le plus dur
(le SaaS multi-tenant). **La vraie valeur à récupérer = la profondeur fonctionnelle et l'ergonomie
du cœur SMQ (P1/P2), pas l'étendue QHSE/RH.**
