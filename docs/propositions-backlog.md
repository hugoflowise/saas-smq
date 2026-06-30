# Propositions — sujets complexes du backlog (à valider)

Issu des retours prod du 26–30 juin. Les quick wins et la refonte audits sont déjà
faits (sur staging). Ce document cadre les sujets plus lourds **avant** de coder.
Chaque section finit par les **questions ouvertes** qui me bloquent.

---

## 1. Objectifs ↔ Politique ↔ KPI (gap ISO 9001 §6.2) — chantier structurant

**Le besoin (4 retours convergents).**
- Chaque **engagement de la politique qualité** doit être décliné en **objectif**, lui-même mesuré par un **KPI** ; on veut montrer la couverture « engagement → objectif → indicateur ».
- Un **tableau de bord de suivi des indicateurs** : intitulé, processus rattaché, objectif rattaché, et suivi par période (mensuel / trimestriel / semestriel / annuel) selon la fréquence.
- Pouvoir ajouter des **indicateurs non rattachés à un processus**.

**Ce qui existe déjà (bonne nouvelle).**
- `indicateurs.frequence_mesure` (mensuel/trim/…) ✅, `indicateurs.processus_id` **déjà nullable** (indicateurs hors processus déjà permis au niveau base) ✅, `indicateurs_valeurs` (valeur + `date_mesure`) ✅, liaison N–N `objectif_indicateurs` ✅, objectifs liés au processus + validés par la direction (§6.2 `valide_par`) ✅.
- **Manque** : la politique qualité est un **contenu libre** (`politique_qualite.contenu` jsonb, texte riche) — il n'existe **aucune liste structurée d'engagements** à laquelle rattacher les objectifs.

**Proposition (3 briques).**

1. **Engagements de la politique** (nouveau) — table `politique_engagements` (tenant, libellé, ordre, soft-delete). Saisis sur la page Politique (liste sous le texte). Puis `objectifs_qualite.engagement_id` (FK nullable) pour rattacher un objectif à un engagement.
   - Affichage d'une **matrice de couverture** : chaque engagement → ses objectifs → leurs indicateurs ; on surligne les engagements **non couverts** (sans objectif, ou objectif sans KPI). C'est la preuve §6.2 « les objectifs sont cohérents avec la politique ».

2. **Indicateurs hors processus** — surtout de l'UI : autoriser la création d'un indicateur sans processus (déjà possible en base), et les regrouper sous « Hors processus » dans la liste plutôt que de les signaler comme orphelins. Faible effort.

3. **Tableau de bord de suivi des indicateurs** (nouveau, lecture) — une page/onglet qui agrège l'existant : par indicateur → processus, objectif, fréquence, cible, et une **série temporelle** des valeurs (colonnes = périodes selon `frequence_mesure`) avec mise en couleur cible atteinte / non atteinte. Réutilisable dans la revue de direction.

**Ordre conseillé** : (2) indicateurs hors processus [petit] → (3) tableau de bord [moyen, valeur immédiate] → (1) engagements + matrice [structurant, à caler avec toi].

**Questions ouvertes.**
- **Engagements** : tes clients rédigent-ils déjà leurs engagements comme une liste de points distincts, ou comme un paragraphe ? (Détermine si on saisit une liste à la main, ou si on garde le texte libre + une liste d'engagements en parallèle.)
- Tableau de bord : tu veux plutôt un **tableau périodes-en-colonnes** (lecture type Excel) ou des **mini-graphes d'évolution** par indicateur ? (cf. maquettes ci-dessous dans les questions)
- La couverture doit-elle être **bloquante** (alerte si un engagement n'a pas de KPI) ou seulement **indicative** ?

---

## 2. Suivi de prestation — porter dans le moteur configurable (Phase 3) + tableau de bord d'analyse

**Phase 3 (perso du formulaire prestation).** Le suivi de prestation est plus sur-mesure que le suivi consultant : **matrice de notes 1–4** (6 axes de satisfaction), attestation sur l'honneur, et l'action alimente **deux tables** (`suivis_prestation` + `enquetes_satisfaction`) avec la logique réclamation (`nps ≤ 6 || satisfaction ≤ 2`). Le porter dans le moteur data-driven demande :
- un nouveau type de champ `matrice` (lignes notées sur une échelle) ;
- réécrire le formulaire public en data-driven et refactorer l'action pour extraire les colonnes/`est_reclamation`/pont satisfaction depuis `reponses` par clé (comme le fait déjà le suivi consultant).

C'est faisable mais **touche un formulaire client en production qui alimente la satisfaction** : je veux le **tester en conditions réelles** (rendu + soumission + pont satisfaction) avant de le livrer, pas le pousser de nuit à l'aveugle. → à faire en priorité dès validation, avec test sur staging.

**Tableau de bord d'analyse des résultats** (revue de direction) : une fois des réponses collectées, une page d'analyse (moyennes par axe, évolution NPS, points forts/faibles récurrents) qui se branche dans la revue de direction. Dépend d'avoir des données ; à faire après la Phase 3.

**Questions ouvertes.**
- OK pour que je fasse la Phase 3 en priorité (avec test staging) plutôt que de nuit sans test ?
- Le tableau de bord d'analyse : on le rattache à la revue de direction (§9.3) directement, ou page autonome d'abord ?

---

## 3. Formulaires hors-ligne (Phase 4, PWA)

Rappel (cf. `docs/formulaires-personnalisables.md`) : transformer le formulaire en **PWA installable** (surtout sur **ordinateur portable** des BM/dirigeants) — saisie sans réseau, stockage local, **envoi automatique au retour du réseau**. Réutilise le moteur data-driven (Phases 1–3).

Chantier réel : service worker + cache de la coquille et de la définition + file d'attente (IndexedDB) + endpoint d'ingestion idempotent (clé anti-doublon). **À faire après la Phase 3** (l'offline doit servir un formulaire déjà data-driven), et **avec tests** (un service worker mal réglé peut servir du contenu périmé).

**Questions ouvertes.**
- Priorité de la Phase 4 par rapport au chantier Objectifs/KPI (§1) ? (les deux sont gros)
- Périmètre offline : les **deux** formulaires (consultant + prestation) d'emblée, ou consultant d'abord ?

---

## 4. Communications avec images

`mailto:` (canal d'envoi actuel) ne transporte **que du texte brut** : impossible d'y embarquer une image ou du HTML. Tu as choisi « pièce jointe simple » — mais une image **stockée sans partir dans le mail** risque de tromper l'utilisateur (il croit qu'elle est envoyée).

**Deux options honnêtes.**
- **(A) Pièce jointe « archivée »** : on attache l'image à la communication dans Flowise (traçabilité interne), avec un libellé clair « visuel conservé dans Flowise, non inclus dans l'e-mail ». Effort moyen (bucket storage + UI), zéro illusion. Utile pour l'archive qualité, pas pour l'e-mail reçu.
- **(B) Vrai moteur d'envoi (Resend)** : emails HTML avec images inline + **traçabilité d'envoi réelle** (répond aussi au retour « comment sait-on qu'une com a bien été envoyée ? »). Plus gros : migration `corps/message` texte → riche, intégration Resend (clé déjà en mémoire comme « à venir »), refonte des 2 dialogs. C'est la vraie solution.

**Recommandation** : viser **(B) Resend** comme cible (résout images + preuve d'envoi d'un coup), faire **(A)** seulement si tu veux un intermédiaire rapide.

**Question ouverte.** On part sur Resend (B) comme chantier dédié, ou tu veux l'intermédiaire (A) tout de suite ?

---

## 5. Module « suivi de fin de mission » (nouveau)

Retour sans description (juste le titre), sur `/admin/clients`. Aucune spec → je ne devine pas.

**Hypothèse à confirmer** : un formulaire de **bilan de fin de mission** (consultant + manager) déclenché quand une mission se termine, distinct du suivi périodique : bilan global, reconduction/clôture, satisfaction finale, capitalisation (points forts, à rejouer), éventuel lien Boond (fin de staffing).

**Questions ouvertes.**
- Qui remplit (manager seul ? consultant aussi ? client ?) et quand (date de fin connue ? déclenché manuellement ?) ?
- Quelles informations clés doit-il capturer ? Réutilise-t-on le moteur de formulaire configurable (un 3ᵉ type) ?
- Lien avec Boond (fin de staffing) attendu ou hors scope au départ ?

---

## Récap décisions attendues
1. Objectifs/KPI : valider l'approche engagements + matrice + tableau de bord, répondre aux 3 questions §1.
2. Phase 3 prestation : OK pour la faire en priorité avec test staging ?
3. Phase 4 offline vs Objectifs/KPI : lequel d'abord ?
4. Communications : Resend (B) ou intermédiaire (A) ?
5. Fin de mission : préciser qui/quand/quoi.
