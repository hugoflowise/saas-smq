# Cahier des charges technique — Outil de pilotage SMQ Flowise

> **Version** : 1.1  
> **Date** : 27/05/2026  
> **Statut** : ✅ Validé par Hugo et Léa — prêt pour développement  
> **Auteur** : Hugo Piovesan (Flowise)

## Changelog

- **v1.1** (27/05/2026) — Validation Hugo + Léa. Confirmation OAuth 2.0 BoondManager + architecture multi-tenant détaillée (section 10).
- **v1.0** (27/05/2026) — Version initiale brouillon.

---

## Table des matières

1. [Contexte et vision produit](#1-contexte-et-vision-produit)
2. [Utilisateurs cibles](#2-utilisateurs-cibles)
3. [Architecture globale](#3-architecture-globale)
4. [Stack technique](#4-stack-technique)
5. [Modèle de données](#5-modèle-de-données)
6. [Architecture multi-tenant](#6-architecture-multi-tenant)
7. [Système de notifications](#7-système-de-notifications)
8. [Workflow documents maîtrisés](#8-workflow-documents-maîtrisés)
9. [Modules MVP détaillés](#9-modules-mvp-détaillés)
10. [Intégration BoondManager](#10-intégration-boondmanager)
11. [Architecture des routes](#11-architecture-des-routes)
12. [Composants UI réutilisables](#12-composants-ui-réutilisables)
13. [Plan de développement séquentiel](#13-plan-de-développement-séquentiel)
14. [Critères de validation MVP](#14-critères-de-validation-mvp)
15. [Conventions de code](#15-conventions-de-code)
16. [Annexes](#16-annexes)

---

## 1. Contexte et vision produit

### 1.1 Problème résolu

Les sociétés de conseil en ingénierie et ESN françaises doivent obtenir et maintenir des certifications qualité (ISO 9001, MASE, CEFRI…) pour accéder aux marchés grands comptes. Les solutions actuelles sont :
- **Recruter un Responsable Qualité interne** (80k€/an chargé, 4-6 mois de recrutement, turnover 24-36 mois)
- **Faire appel à des cabinets ponctuels** (1200-2000€/jour, pas d'engagement de résultat)
- **Utiliser des outils SMQ génériques industriels** (BlueKango, Qualio…) inadaptés à la prestation intellectuelle

Flowise propose une externalisation du management qualité avec engagement contractuel de résultat. Cet outil est **le différenciateur produit** : un logiciel SMQ moderne, intégré aux outils métier (BoondManager), spécifiquement conçu pour les SI/ESN.

### 1.2 Vision en une phrase

> Un outil qui permet de piloter en temps réel le SMQ d'une société d'ingénierie / ESN, en exploitant les données BoondManager pour rendre le management qualité vivant et auditeur-ready à tout moment.

### 1.3 Objectifs

1. **Couvrir 100% des exigences ISO 9001:2015** dans un seul outil — la certification doit pouvoir s'obtenir en ne montrant que cet outil à l'auditeur externe
2. **Centraliser toute la documentation et les enregistrements** — pas de Word, pas de PDF externes
3. **Connecter les données métier** (BoondManager) pour des KPI vivants
4. **Permettre à Léa de piloter 5-10 clients simultanément**
5. **Être vendable standalone** à terme, à des sociétés qui veulent un outil sans le service Flowise

### 1.4 Périmètre v1 MVP

- **Norme couverte** : ISO 9001:2015 uniquement (multi-norme en v2)
- **Cible : SI/ESN/AT** (10-300 personnes typiquement)
- **Volume cible** : 5-10 tenants pour le MVP, montée à 50-100 en v2

### 1.5 Hors périmètre v1

- Multi-normes (14001, 45001, MASE, CEFRI) — en v2
- Mobile app native — web responsive uniquement
- Onboarding self-serve client — Léa onboarde manuellement
- Marketplace de templates
- IA d'analyse des NC

---

## 2. Utilisateurs cibles

### 2.1 Admin Flowise (Hugo, Léa, futurs collaborateurs Flowise)

- Accès **multi-tenant** : peut "se connecter sur" n'importe quel tenant client
- Voit toutes les données du tenant qu'il consulte
- Peut modifier la configuration, les processus, les documents
- Workflow d'approbation : peut soumettre, valider (selon délégation)

### 2.2 Dirigeant client (DG de la SI/ESN)

- Accès à **son tenant uniquement**
- Vue d'ensemble du SMQ de sa société
- Approuve les documents maîtrisés (signature électronique)
- Consulte KPI, indicateurs, statut conformité ISO

### 2.3 Manager / Pilote de processus (v2)

- Accès restreint à **certains modules** : le processus dont il est pilote, le plan d'action qui le concerne
- Peut éditer les actions de son périmètre

### 2.4 Auditeur externe (v2)

- Accès **temporaire, lecture seule**, sur invitation par le client
- Accès limité à la version publiée du manuel et aux preuves de conformité
- Ne voit pas les brouillons, ni les conversations internes

---

## 3. Architecture globale

### 3.1 Schéma haut niveau

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT (Navigateur web)                    │
│  Next.js 15 SSR + React 18 + Tailwind + shadcn/ui          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL (Hosting + Edge Functions)              │
│  • SSR Next.js                                              │
│  • API Routes pour intégrations sortantes                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────────┐
        ▼                               ▼
┌──────────────────────┐    ┌───────────────────────────┐
│  SUPABASE            │    │  APIs externes            │
│  • Postgres + RLS    │    │  • BoondManager           │
│  • Auth (multi-tenant)│   │  • SMTP (notifications)   │
│  • Storage (assets)  │    │  • Signatures (later)     │
│  • Realtime          │    │                           │
│  • Edge Functions    │    │                           │
└──────────────────────┘    └───────────────────────────┘
```

### 3.2 Isolation des données

- **1 instance Supabase**
- **Multi-tenant via Row Level Security (RLS) Postgres** : chaque table contient un champ `tenant_id`, et les RLS policies filtrent automatiquement les requêtes selon le tenant de l'utilisateur connecté
- Les **admins Flowise** ont une policy spéciale permettant d'accéder à tous les tenants
- Pas de cross-tenant data leak possible si les policies sont bien écrites

### 3.3 Sécurité

- HTTPS obligatoire (Vercel + Supabase natifs)
- Auth via Supabase : magic link + email/password
- Tokens JWT short-lived (1h) avec refresh
- RLS policies testées avec des comptes de test multi-tenant
- Audit log de toutes les actions sensibles (modifications, suppressions, signatures)
- Stockage RGPD : Supabase EU (region Frankfurt)
- Chiffrement at-rest natif Postgres

---

## 4. Stack technique

### 4.1 Frontend

| Outil | Version | Usage |
|---|---|---|
| **Next.js** | 15.x | Framework React avec SSR, App Router |
| **React** | 18.x | Bibliothèque UI |
| **TypeScript** | 5.x | Typage strict |
| **Tailwind CSS** | 3.x | Styling utilitaire |
| **shadcn/ui** | latest | Composants UI (copie locale, pas dependency) |
| **Tiptap** | latest | Éditeur de texte riche (procédures, manuel) |
| **Recharts** | latest | Charts pour KPI / dashboards |
| **React Hook Form** | 7.x | Forms |
| **Zod** | 3.x | Validation schémas |
| **TanStack Query** | 5.x | Data fetching / caching |
| **date-fns** | 3.x | Manipulation dates |
| **Lucide Icons** | latest | Icônes |

### 4.2 Backend / DB

| Outil | Usage |
|---|---|
| **Supabase Postgres** | DB principale avec RLS |
| **Supabase Auth** | Authentification multi-tenant |
| **Supabase Storage** | Stockage des fichiers (PDFs signés, attachements) |
| **Supabase Realtime** | Notifications temps réel |
| **Supabase Edge Functions (Deno)** | Logique serveur (webhooks, sync Boond) |
| **Next.js API Routes** | API custom si besoin |

### 4.3 Intégrations externes

- **BoondManager API** : OAuth 2.0, REST, polling régulier + webhooks si dispo
- **SMTP** : Resend (transactionnel email, free tier 3000 mails/mois)
- **Signatures électroniques (v2)** : DocuSign / Yousign (à arbitrer)

### 4.4 Hosting et déploiement

- **Vercel** : hosting Next.js (free tier suffisant au démarrage)
- **Supabase** : hosted (free tier 500MB DB, 50k MAU)
- **Domaine** : `app.flowise.fr` (subdomain principal du produit)
- **CI/CD** : Vercel auto-deploy sur push Git
- **Monorepo** : pas nécessaire, single Next.js app

### 4.5 Outils dev

- **Bun** ou **pnpm** comme package manager
- **Biome** ou **ESLint + Prettier** pour lint/format
- **Playwright** pour tests E2E critiques (auth, sign workflow)
- **Vitest** pour tests unitaires
- **Storybook (optionnel)** pour les composants UI réutilisables

### 4.6 Coût estimé

| Phase | Coût mensuel |
|---|---|
| MVP (1-5 tenants) | ~0 € (free tiers) |
| Mois 6-12 (10-30 tenants) | ~50-100 €/mois (Supabase Pro + Vercel Pro) |
| Année 2 (50+ tenants) | ~200-500 €/mois |

---

## 5. Modèle de données

### 5.1 Conventions

- Toutes les tables ont : `id` (uuid), `tenant_id` (uuid, fk vers tenants), `created_at`, `updated_at`, `created_by` (uuid user), `updated_by` (uuid user)
- Champ `deleted_at` pour soft delete (jamais de hard delete sur les entités SMQ)
- Naming : `snake_case` pour SQL, `camelCase` pour TypeScript
- Une table `audit_log` capture toutes les modifications avec diff JSON

### 5.2 Tables principales

#### Tables d'infrastructure

```sql
-- TENANTS (clients Flowise)
tenants {
  id: uuid PK
  nom_societe: text
  effectif_tranche: enum
  secteur: enum
  date_souscription: date
  formule: enum ('Essentiel', 'Tandem', 'Premium')
  statut: enum ('Actif', 'Suspendu', 'Résilié')
  boond_oauth_token: text (encrypted)
  boond_account_id: text
  created_at: timestamp
  updated_at: timestamp
}

-- USERS (Supabase Auth users + métadonnées tenant)
profiles {
  id: uuid PK (= auth.users.id)
  email: text UK
  full_name: text
  tenant_id: uuid FK (null si admin Flowise)
  role: enum ('admin_flowise', 'dirigeant', 'manager', 'auditeur')
  avatar_url: text
  last_seen: timestamp
  notification_preferences: jsonb
}

-- AUDIT_LOG (traçabilité)
audit_log {
  id: uuid PK
  tenant_id: uuid
  user_id: uuid FK
  action: text -- 'create', 'update', 'delete', 'sign'
  entity_type: text -- 'procedure', 'nc', etc.
  entity_id: uuid
  diff: jsonb -- changements avant/après
  timestamp: timestamp
}

-- NOTIFICATIONS
notifications {
  id: uuid PK
  tenant_id: uuid
  recipient_user_id: uuid FK
  type: enum ('approval_request', 'deadline', 'audit_upcoming', 'kpi_alert', 'nc_assigned', ...)
  title: text
  body: text
  link: text -- url interne
  is_read: bool
  created_at: timestamp
}
```

#### Tables SMQ — Contexte & Stratégie

```sql
-- CONTEXTE de l'organisme (§4.1)
contexte_organisme {
  id, tenant_id, ...
  analyse_swot: jsonb { forces, faiblesses, opportunites, menaces }
  analyse_pestel: jsonb { politique, economique, sociologique, technologique, ecologique, legal }
  date_revue: date
  prochain_revue: date
}

-- PARTIES INTÉRESSÉES (§4.2)
parties_interessees {
  id, tenant_id, ...
  nom: text
  type: enum ('client', 'fournisseur', 'collaborateur', 'autorite', 'actionnaire', 'autre')
  attentes: text
  exigences: text
  niveau_influence: enum ('faible', 'moyen', 'fort')
}

-- PÉRIMÈTRE SMQ (§4.3)
perimetre_smq {
  id, tenant_id, ... (UNIQUE par tenant)
  domaine_application: text -- éditeur Tiptap
  exclusions: text
  justifications_exclusions: text
}

-- POLITIQUE QUALITÉ (§5.2) — document maîtrisé
politique_qualite {
  id, tenant_id, ...
  contenu: jsonb -- structure Tiptap
  statut: enum ('brouillon', 'en_revue', 'approuvee', 'publiee', 'archivee')
  version_actuelle_id: uuid FK -> politique_qualite_versions
}

politique_qualite_versions {
  id, tenant_id, ...
  politique_id: uuid FK
  version: text -- "1.0", "1.1", "2.0"
  contenu_snapshot: jsonb -- snapshot figé
  approved_by: uuid FK -> profiles
  signature_data: jsonb -- {timestamp, ip, certificat}
  approved_at: timestamp
  pdf_url: text -- chemin Supabase Storage
}

-- OBJECTIFS QUALITÉ (§6.2)
objectifs_qualite {
  id, tenant_id, ...
  intitule: text
  description: text
  est_smart: bool
  cible_chiffree: text -- "Atteindre 90% de satisfaction"
  echeance: date
  responsable_id: uuid FK -> profiles
  fonction_concernee: text -- "BM", "TA", "RH", etc.
  indicateurs_lies: uuid[] FK -> indicateurs
  statut: enum ('actif', 'atteint', 'abandonné')
}
```

#### Tables SMQ — Processus & Procédures

```sql
-- CARTOGRAPHIE PROCESSUS (§4.4)
processus {
  id, tenant_id, ...
  nom: text -- "Recrutement", "Mise en mission", "Suivi prestations"
  type: enum ('pilotage', 'realisation', 'support')
  description: text
  pilote_id: uuid FK -> profiles
  entrees: text
  sorties: text
  ressources_associees: text
  ordre_affichage: int
}

-- FICHE D'IDENTITÉ PROCESSUS
fiche_identite_processus {
  id, tenant_id, ...
  processus_id: uuid FK
  objectifs: text
  perimetre: text
  contributeurs: text
  documents_associes: uuid[] FK -> procedures
}

-- PROCÉDURES (document maîtrisé)
procedures {
  id, tenant_id, ...
  titre: text
  processus_id: uuid FK
  reference_iso: text[] -- ["7.5", "8.4.1"]
  pilote_id: uuid FK
  description_courte: text
  statut: enum ('brouillon', 'en_revue', 'approuvee', 'publiee', 'archivee')
  version_actuelle_id: uuid FK -> procedures_versions
}

procedures_versions {
  id, tenant_id, procedure_id, version, contenu_snapshot (jsonb), 
  approved_by, signature_data, approved_at, pdf_url, ...
}

-- MODES OPÉRATOIRES (sous-doc procédure)
modes_operatoires {
  id, tenant_id, ...
  titre: text
  procedure_id: uuid FK
  contenu: jsonb -- Tiptap
  statut + versions (idem procédures)
}
```

#### Tables SMQ — Indicateurs

```sql
-- INDICATEURS / KPI
indicateurs {
  id, tenant_id, ...
  nom: text -- "Taux de satisfaction client"
  description: text
  processus_id: uuid FK (nullable si KPI global)
  type: enum ('numeric', 'percentage', 'count', 'duration')
  unite: text
  cible: numeric
  seuil_alerte_min: numeric
  seuil_alerte_max: numeric
  frequence_mesure: enum ('quotidien', 'hebdo', 'mensuel', 'trimestriel', 'annuel')
  source: enum ('manuel', 'boondmanager', 'calcul')
  formule_calcul: text -- si source = calcul
  boond_endpoint: text -- si source = boondmanager
}

-- VALEURS INDICATEURS (séries temporelles)
indicateurs_valeurs {
  id, tenant_id, ...
  indicateur_id: uuid FK
  valeur: numeric
  date_mesure: date
  commentaire: text
  source_donnees: jsonb -- raw data
}
```

#### Tables SMQ — Risques, R&O, Veille

```sql
-- RISQUES & OPPORTUNITÉS (§6.1)
risques_opportunites {
  id, tenant_id, ...
  intitule: text
  type: enum ('risque', 'opportunite')
  processus_id: uuid FK
  cause: text
  consequence: text
  gravite: int -- 1 à 5
  probabilite: int -- 1 à 5
  criticite: int -- calculé : gravite * probabilite
  traitement_prevu: text
  actions_liees: uuid[] FK -> actions
  responsable_id: uuid FK -> profiles
  statut: enum ('identifie', 'en_traitement', 'maitrise', 'cloture')
  date_revue: date
}

-- VEILLE RÉGLEMENTAIRE
veille_reglementaire {
  id, tenant_id, ...
  reference: text -- "Code du travail Art. L4121-1"
  intitule: text
  domaine: enum ('travail', 'qualite', 'environnement', 'securite', 'rgpd', 'autre')
  date_publication: date
  date_application: date
  impact_smq: text
  actions_a_prevoir: text
  statut: enum ('a_analyser', 'analysee', 'integree', 'sans_objet')
  responsable_id: uuid FK
}
```

#### Tables SMQ — Activité opérationnelle

```sql
-- COMPÉTENCES (matrice)
competences {
  id, tenant_id, ...
  intitule: text -- "Audit interne ISO 9001", "Management d'équipe"
  niveau_requis: int -- 1 à 5
  domaine: text
}

competences_utilisateurs {
  id, tenant_id, ...
  user_id: uuid FK -> profiles (ou consultant Boond)
  competence_id: uuid FK
  niveau: int
  preuves: jsonb -- diplômes, certifications, urls
  date_acquisition: date
  date_validite: date (null si pas d'expiration)
}

-- FORMATION
formations {
  id, tenant_id, ...
  intitule: text
  organisme: text
  date_debut: date
  date_fin: date
  duree_heures: int
  participants: uuid[] FK -> profiles
  competences_visees: uuid[] FK -> competences
  evaluation_post: jsonb
}

-- ENREGISTREMENTS (instances de formulaires remplis)
enregistrements {
  id, tenant_id, ...
  type: enum ('fiche_nc', 'fiche_action', 'compte_rendu_visite_securite', 'pdp', 'revue_offre', ...)
  contenu: jsonb -- données structurées
  date_creation: date
  reference_processus: uuid FK -> processus
  reference_norme: text[] -- ["7.5", "8.5.4"]
}
```

#### Tables SMQ — Non-Conformités & Actions

```sql
-- NON-CONFORMITÉS
non_conformites {
  id, tenant_id, ...
  reference: text -- auto "NC-2026-001"
  intitule: text
  description: text
  date_constat: date
  origine: enum ('audit_interne', 'audit_externe', 'client', 'collaborateur', 'rdd', 'autre')
  origine_detail: text
  processus_concerne: uuid FK
  gravite: enum ('mineure', 'majeure', 'critique')
  type: enum ('nc_produit', 'nc_processus', 'reclamation_client')
  causes_identifiees: jsonb -- liste structurée 5 pourquoi ou Ishikawa
  responsable_traitement: uuid FK -> profiles
  statut: enum ('ouverte', 'analysee', 'action_definie', 'cloturee', 'efficace', 'inefficace')
  date_cloture: date
  actions_correctives: uuid[] FK -> actions
}

-- PLAINTES & RÉCLAMATIONS (§9.1.2)
reclamations {
  id, tenant_id, ...
  client_id: uuid -- soit FK profiles, soit ref Boond
  date_reception: date
  canal: enum ('mail', 'tel', 'visio', 'audit', 'enquete', 'autre')
  description: text
  gravite: enum ('mineure', 'majeure', 'critique')
  nc_associee: uuid FK -> non_conformites (nullable)
  traitement: text
  date_reponse: date
  satisfait_client: bool
  statut: enum ('reçue', 'analysee', 'traitee', 'cloturee')
}

-- PLAN D'ACTION (global)
actions {
  id, tenant_id, ...
  reference: text -- "ACT-2026-001"
  action_standard_id: uuid (lien optionnel vers bibliothèque)
  ordre_dans_plan: int
  description_courte: text
  description_detail: text
  origine: enum ('demarrage_smq', 'audit_interne', 'audit_externe', 'nc', 'rdd', 'r_o', 'reclamation', 'amelioration_continue')
  origine_detail_id: uuid -- FK polymorphe
  processus_concerne: uuid FK -> processus
  reference_iso: text[]
  type: enum ('preventive', 'corrective')
  priorite: enum ('p1', 'p2', 'p3')
  responsable_id: uuid FK -> profiles
  date_creation: date
  date_prevue: date
  date_effective: date
  statut: enum ('a_faire', 'en_cours', 'termine', 'bloquee', 'abandonnee')
  indicateur_efficacite: text
  resultats_mesures: text
  commentaires: text
}

-- BIBLIOTHÈQUE D'ACTIONS STANDARDS (les 80 actions ISO 9001 du référentiel Flowise)
actions_standards_bibliotheque {
  id, ... (pas de tenant_id, c'est la biblio globale)
  ordre: int (1 à 80)
  description_courte: text
  origine_action: text
  description_constat: text
  causes_fondamentales: text
  action_a_mener: text
  reference_iso: text[]
  priorite_par_defaut: enum
  type_par_defaut: enum
  indicateur_de_mesure: text
  norme: text -- "ISO 9001"
  secteur_cible: text -- "SI/ESN/AT"
  est_active: bool
  version: int
}
```

#### Tables SMQ — Audits & Revues

```sql
-- PROGRAMME D'AUDIT INTERNE (sur 3 ans)
programme_audit {
  id, tenant_id, ...
  annee_debut: int
  annee_fin: int -- 3 ans après
  description: text
  approuve_par: uuid FK -> profiles
  approuve_le: timestamp
}

-- AUDITS INTERNES PLANIFIÉS
audits_internes {
  id, tenant_id, ...
  reference: text -- "AI-2026-001"
  programme_id: uuid FK
  processus_audites: uuid[] FK -> processus
  auditeur_id: uuid FK -> profiles
  date_prevue: date
  date_realisee: date
  duree_prevue: numeric -- en heures
  statut: enum ('planifie', 'en_cours', 'realise', 'rapport_redige', 'cloture')
  grille_audit: jsonb -- structure pré-remplie
  rapport_audit: jsonb -- structure du rapport
  ecarts_identifies: uuid[] FK -> non_conformites
  actions_issues: uuid[] FK -> actions
  approuve_par: uuid FK -> profiles
}

-- REVUES DE PROCESSUS (annuelles)
revues_processus {
  id, tenant_id, ...
  processus_id: uuid FK
  annee: int
  date_realisation: date
  participants: uuid[] FK -> profiles
  indicateurs_examines: uuid[] FK -> indicateurs
  ncs_examines: uuid[] FK -> non_conformites
  actions_examinees: uuid[] FK -> actions
  conclusions: text
  decisions: text
  actions_issues: uuid[] FK -> actions
  compte_rendu_pdf_url: text
}

-- REVUES DE DIRECTION (annuelles, §9.3)
revues_direction {
  id, tenant_id, ...
  annee: int
  date_realisation: date
  participants: uuid[] FK -> profiles
  entrees: jsonb -- collecte auto des KPI, NC, audits, satisfaction
  ordre_du_jour: text
  conclusions: text
  decisions: text
  actions_issues: uuid[] FK -> actions
  compte_rendu_pdf_url: text
  approuve_par: uuid FK -> profiles
}
```

#### Tables SMQ — Satisfaction client

```sql
-- ENQUÊTES DE SATISFACTION
enquetes_satisfaction {
  id, tenant_id, ...
  titre: text
  type: enum ('npss_mission', 'satisfaction_annuelle', 'suivi_consultant', 'suivi_prestation')
  questions: jsonb -- structure du questionnaire
  date_envoi: date
  date_cloture: date
  destinataires: jsonb -- liste emails / contacts
  statut: enum ('brouillon', 'en_cours', 'cloturee')
  -- liens externes pour formulaires existants (Forms / autres)
  formulaire_externe_url: text
}

-- RÉPONSES AUX ENQUÊTES
enquetes_reponses {
  id, tenant_id, ...
  enquete_id: uuid FK
  reponses: jsonb
  repondant_email: text
  date_reponse: timestamp
  client_concerne_id: uuid -- ref Boond
  mission_concernee_id: uuid -- ref Boond
  score_global: numeric -- calculé
}
```

#### Tables SMQ — Conformité ISO 9001

```sql
-- RÉFÉRENTIEL ISO 9001:2015 (table globale, pas multi-tenant)
referentiel_iso {
  id, ...
  norme: text -- "ISO 9001"
  version: text -- "2015"
  chapitre: text -- "4.4"
  intitule: text -- "Système de management de la qualité et ses processus"
  description: text
  exigences: jsonb -- liste des exigences détaillées
  preuves_attendues: text -- ce que l'auditeur cherche
  domaine: enum ('contexte', 'leadership', 'planification', 'support', 'realisation', 'evaluation', 'amelioration')
  est_obligatoire: bool
  ordre_affichage: int
}

-- AUTO-ÉVALUATION DE CONFORMITÉ par chapitre, par tenant
conformite_evaluation {
  id, tenant_id, ...
  referentiel_iso_id: uuid FK
  cotation: enum ('conforme', 'point_fort', 'point_attention', 'nc_mineure', 'nc_majeure', 'non_applicable', 'non_evalue')
  preuves_liees: jsonb -- liste d'entités liées : [{ entity_type, entity_id }]
  commentaire: text
  date_evaluation: date
  evaluateur_id: uuid FK -> profiles
}
```

#### Tables SMQ — Calendrier qualité

```sql
-- ÉVÉNEMENTS QUALITÉ (audit, revue, surveillance, etc.)
evenements_qualite {
  id, tenant_id, ...
  titre: text
  type: enum ('audit_interne', 'audit_externe', 'revue_processus', 'revue_direction', 'surveillance', 'renouvellement', 'comite_qualite', 'formation', 'autre')
  date_debut: date
  date_fin: date
  description: text
  responsable_id: uuid FK
  participants: uuid[] FK
  entite_liee_type: text -- pour relier à un audit, revue, etc.
  entite_liee_id: uuid
  statut: enum ('planifie', 'confirme', 'realise', 'annule', 'reporte')
  rappels_envoyes: jsonb -- [{date, recipients}]
}
```

### 5.3 RLS Policies (exemples)

```sql
-- Exemple sur la table 'procedures'
CREATE POLICY "Users see only their tenant data"
  ON procedures FOR SELECT
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    OR (auth.jwt() ->> 'role') = 'admin_flowise'
  );

CREATE POLICY "Only managers+ can edit"
  ON procedures FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin_flowise', 'dirigeant', 'manager')
  );
```

À écrire pour **toutes les tables**. Toutes ont la policy d'isolation par tenant + role-based access.

---

## 6. Architecture multi-tenant

### 6.1 Modèle d'auth

- Chaque user a un `tenant_id` dans son JWT claims (sauf admin_flowise = null)
- Quand un admin Flowise se connecte, il choisit le tenant sur lequel il veut travailler (écran de sélection après login)
- Le tenant courant est stocké en sessionStorage + injecté dans tous les requests via header `X-Active-Tenant`
- Les RLS policies utilisent ce contexte

### 6.2 Création d'un nouveau tenant

Workflow admin Flowise :
1. Hugo/Léa va dans `Admin Flowise → Clients → Nouveau tenant`
2. Remplit : nom société, formule, effectif, secteur, dirigeant (email)
3. Création :
   - Insertion dans `tenants`
   - Création d'un user `dirigeant` (envoi magic link à son email)
   - Init du programme d'audit 3 ans
   - Init de la cartographie processus standard SI/ESN
   - Init des 80 actions standard ISO 9001 dans `actions` (depuis la bibliothèque)
   - Init des entités R&O type, parties prenantes type, indicateurs type

### 6.3 Switching admin Flowise

- Admin Flowise voit en haut de l'écran un dropdown "Tenant actif : [Société X]"
- Peut switcher → la page se recharge avec le contexte du nouveau tenant
- L'admin a un dashboard portfolio cross-tenants (vue d'ensemble des 5-10 clients qu'il gère)

---

## 7. Système de notifications

### 7.1 Types de notifications

| Type | Déclencheur | Destinataire |
|---|---|---|
| `approval_request` | Document soumis à approbation | Approbateur (DG client) |
| `approval_granted` | Document approuvé | Auteur de la soumission |
| `deadline_action` | Action en retard ou approchant échéance | Responsable de l'action |
| `audit_upcoming` | Audit interne / externe approche (J-60, J-30, J-7) | Léa + DG client |
| `kpi_alert` | Indicateur hors seuil | Pilote du processus + Léa |
| `nc_assigned` | NC assignée à un responsable | Responsable traitement |
| `nc_overdue` | NC ouverte depuis trop longtemps | Léa |
| `rdd_due` | Revue de direction à planifier | DG client + Léa |
| `boond_sync_error` | Erreur de synchronisation | Léa |
| `policy_review_due` | Politique qualité à réviser annuellement | DG client + Léa |
| `mention` | Mention dans un commentaire | User mentionné |

### 7.2 Canaux

- **In-app** : centre de notification (cloche en haut), badge non-lu
- **Email** : via Resend pour les notifs critiques (approbations, deadlines)
- **Hebdo digest** : 1 email/semaine récapitulatif (config user)

### 7.3 Préférences user

Chaque user peut configurer dans `Mon compte → Notifications` :
- Quels types reçoit-il en-app / email / digest
- Délai avant relance (snooze)

### 7.4 Implémentation

- Table `notifications` en DB (cf. section 5.2)
- Realtime Supabase pour les notifs in-app (subscribe sur `notifications` filtré par user_id)
- Edge Function `send_email_notification` déclenchée sur insert dans `notifications` (selon prefs user) → appel Resend API
- Cron job (Supabase pg_cron ou Vercel cron) pour les digests hebdo et les checks périodiques (deadlines, KPI hors seuil)

---

## 8. Workflow documents maîtrisés

### 8.1 Cycle de vie d'un document maîtrisé

S'applique à : **Politique qualité, Procédures, Modes opératoires, Manuel qualité**.

```
┌─────────────┐
│   BROUILLON │  Auteur édite librement, pas de version
└──────┬──────┘
       │ Soumettre à revue
       ▼
┌─────────────┐
│  EN REVUE   │  Approbateur reçoit notif, peut commenter, demander modifs
└──────┬──────┘
       │ Refusé → retour Brouillon
       │ Approuvé
       ▼
┌─────────────┐
│  APPROUVÉE  │  Signature électronique (timestamp + user)
└──────┬──────┘
       │ Publier
       ▼
┌─────────────┐
│   PUBLIÉE   │  Version vN.M, snapshot figé, PDF généré
└─────────────┘  Visible des auditeurs externes
       │
       │ Une nouvelle version commence par Brouillon vN.M+1
       ▼
┌─────────────┐
│  ARCHIVÉE   │  Version antérieure (consultable mais plus en vigueur)
└─────────────┘
```

### 8.2 Mécanisme de snapshot

Quand un document passe à PUBLIÉE :
1. Le contenu actuel (champ `contenu` jsonb) est **copié** dans la table `*_versions`
2. Un PDF est généré (template HTML + react-pdf ou Puppeteer) et stocké dans Supabase Storage
3. Le snapshot contient aussi les **données référencées** au moment de la publication (politique, processus mentionnés, etc.)
4. Cette version est **immutable** : aucune modification possible
5. Le document principal peut continuer à évoluer (nouveau brouillon)

### 8.3 Signature électronique

**v1 MVP** : signature interne simple
- Champ `signature_data jsonb` : `{ user_id, timestamp, ip_address, user_agent }`
- L'approbateur clique "J'approuve" + entre son mot de passe → on enregistre la signature
- Suffisant pour ISO 9001 (pas d'exigence eIDAS qualifiée)

**v2** : intégration DocuSign / Yousign pour signature qualifiée si besoin client haut de gamme.

### 8.4 Workflow approbation

1. Auteur clique "Soumettre à approbation"
2. Sélectionne approbateur (par défaut : DG du tenant)
3. Notification créée pour l'approbateur (in-app + email)
4. Approbateur reçoit, examine, peut :
   - **Demander modifications** : commentaire → retour à Brouillon, notif à l'auteur
   - **Approuver** : signature électronique
5. Document passe à PUBLIÉE, snapshot créé, PDF généré
6. Tous les utilisateurs du tenant reçoivent une notif "Nouvelle version v1.3 publiée"
7. La version PRÉCÉDENTE est marquée comme ARCHIVÉE (toujours consultable)

### 8.5 Traçabilité

Pour chaque document :
- Liste des versions (1.0, 1.1, 1.2, ... 1.3 en vigueur)
- Pour chaque version : qui a créé, qui a approuvé, quand, le contenu figé, le PDF
- L'auditeur externe peut consulter la version v1.3 PDF
- Si question "Qu'est-ce qui a changé entre v1.2 et v1.3 ?" → diff visualisable

---

## 9. Modules MVP détaillés

### Module 1 — Auth & Multi-tenant

**Écrans** :
- `/login` : email + magic link
- `/select-tenant` (admin Flowise uniquement) : liste des tenants accessibles
- `/onboarding` (1ère connexion d'un dirigeant) : confirmation infos + mot de passe

**Logique** :
- Supabase Auth gère le JWT
- Edge function `on_auth_signup` : populate la table `profiles`
- Middleware Next.js : vérifie le tenant actif, redirige si non choisi

**Critères de validation** :
- Léa peut se connecter et switcher entre 2 tenants tests
- Le DG d'un tenant ne peut PAS voir un autre tenant
- Logout fonctionne

---

### Module 2 — Cartographie processus

**Écrans** :
- `/processus` : liste avec vue cartographie visuelle (3 colonnes : pilotage / réalisation / support)
- `/processus/[id]` : détail d'un processus
  - Onglet "Fiche d'identité"
  - Onglet "Procédures liées"
  - Onglet "Indicateurs"
  - Onglet "R&O"
  - Onglet "Audits"
  - Onglet "NC liées"

**Init au démarrage du tenant** : template SI/ESN standard, comprenant :
- **Pilotage** : Pilotage stratégique / Management qualité / Communication
- **Réalisation** : Commercial / Recrutement / Mise en mission / Suivi prestation / Fin de mission
- **Support** : RH / Infrastructure / Achats / SI / Finance

**Critères de validation** :
- Création / édition d'un processus
- Affectation d'un pilote
- Visualisation cartographie type Notion-board

---

### Module 3 — Politique qualité + Objectifs

**Écrans** :
- `/strategie/politique` : politique qualité (document maîtrisé, éditeur Tiptap)
- `/strategie/objectifs` : liste des objectifs SMART, déclinaisons par fonction

**Workflow** : politique = document maîtrisé (Brouillon → Publié, cf. §8)

**Init** : template de politique qualité SI/ESN type à customiser

**Critères de validation** :
- Léa peut éditer la politique en brouillon
- DG l'approuve, signature électronique enregistrée
- PDF généré, consultable
- Objectifs SMART créés avec cible chiffrée, liés à un indicateur

---

### Module 4 — Procédures (documents maîtrisés)

**Écrans** :
- `/documentation/procedures` : liste, filtrable par processus, par § ISO
- `/documentation/procedures/[id]` : éditeur Tiptap + métadonnées + versions

**Init** : template de 20 procédures type SI/ESN (revue d'offre, mise en mission, etc.) en brouillon, à customiser

**Critères de validation** :
- Éditeur Tiptap fonctionnel (paragraphes, listes, tableaux, liens)
- Workflow Brouillon → Revue → Publié OK
- Génération PDF correcte
- Versioning : v1.0, v1.1, v2.0 navigables
- Historique des modifs visible

---

### Module 5 — Plan d'action global

**Écrans** :
- `/actions` : vue tableau + Kanban par statut + filtres
- `/actions/[id]` : détail d'une action, édition
- `/actions/nouvelle` : création manuelle d'une action

**Init** : 80 actions standards ISO 9001 importées depuis `actions_standards_bibliotheque` (récupérables depuis l'Airtable actuel)

**Sources d'actions** :
- Standards (au démarrage)
- Issues d'audits internes
- Issues de RDD
- Issues de NC
- Issues de R&O
- Créées manuellement

**Critères de validation** :
- Voir les 80 actions au démarrage d'un tenant
- Filtres par § ISO, processus, priorité, statut, responsable
- Édition statut, dates, commentaires
- Vue Kanban drag-and-drop
- Notif quand action approche échéance

---

### Module 6 — Auto-évaluation conformité ISO 9001

**Écrans** :
- `/conformite` : tableau de bord par domaine ISO (Contexte / Leadership / Planification / Support / Réalisation / Évaluation / Amélioration)
- `/conformite/[chapitre]` : détail d'un chapitre (ex : §4.4) avec :
  - Description de l'exigence
  - Cotation actuelle
  - Preuves liées (avec liens cliquables vers les entités)
  - Évaluation, commentaire
  - Historique d'évaluation

**Logique** :
- Référentiel ISO 9001:2015 pré-chargé en DB (40-50 lignes)
- Pour chaque chapitre, l'app affiche les **entités liées** (procédures qui couvrent, indicateurs, actions, etc.) → mécanisme automatique de liens
- Cotation manuelle par Léa : Conforme / Point Fort / PA / NC mineure / NC majeure
- Statut global du tenant : % conforme, à risque, NC

**Critères de validation** :
- Vue par chapitre avec preuves automatiquement liées
- Cotation modifiable, historisée
- Export PDF "Statut de conformité" pour audit externe

---

### Module 7 — Indicateurs / KPI

**Écrans** :
- `/indicateurs` : dashboard global de tous les KPI (cards numériques + sparklines)
- `/indicateurs/[id]` : détail d'un indicateur (graphique évolution, seuils, valeurs)
- Mini-dashboard intégré dans chaque processus (filtré sur ses indicateurs)

**Types d'indicateurs** :
- **Manuel** : Léa saisit la valeur chaque période
- **BoondManager** : auto-rempli depuis l'API (effectif, inter-contrat, missions, etc.)
- **Calculé** : formule sur d'autres indicateurs

**Init** : 15-20 indicateurs type SI/ESN pré-configurés
- Taux d'inter-contrat (Boond)
- Effectif (Boond)
- Nb missions actives (Boond)
- Taux de satisfaction client (manuel/enquêtes)
- Délai moyen de mise en mission (Boond)
- Taux de transformation opportunités (Boond)
- Nb NC ouvertes (auto, app)
- Délai moyen traitement NC (auto, app)
- Taux de formation (auto via Boond + manuel)
- ...

**Critères de validation** :
- Indicateurs auto-mis-à-jour depuis Boond
- Charts Recharts fonctionnels (sparkline + détail)
- Alerte quand hors seuil (notification)
- Saisie manuelle d'une valeur OK

---

### Module 8 — Intégration BoondManager

Voir section 10 dédiée.

---

### Module 9 — Non-Conformités + Actions correctives

**Écrans** :
- `/nc` : liste avec filtres (statut, gravité, processus, période)
- `/nc/[id]` : détail d'une NC
  - Description, origine, processus concerné
  - Analyse des causes (5 pourquoi guidé OU Ishikawa)
  - Actions correctives associées (liens vers Module 5)
  - Vérification d'efficacité (relance auto N+3 mois)
- `/nc/nouvelle` : formulaire de création

**Workflow** :
1. Création NC (Léa ou auto via NC d'audit)
2. Analyse cause (Léa, en lien avec dirigeant ou pilote processus)
3. Création action corrective → injection dans Module 5
4. Suivi de l'action
5. Vérification efficacité (relance auto)
6. Clôture (Efficace / Inefficace → nouvelle analyse)

**Critères de validation** :
- Workflow complet d'une NC de l'ouverture à la clôture
- 5 pourquoi guidé interactif
- Liaison NC → action automatique
- Relance auto vérification efficacité

---

### Module 10 — Audits internes

**Écrans** :
- `/audits/programme` : programme pluriannuel 3 ans, visu calendrier
- `/audits` : liste des audits planifiés / réalisés
- `/audits/[id]` : détail audit
  - Préparation (grille d'audit, périmètre)
  - Réalisation (rapport, écarts identifiés)
  - Suivi écarts (vers Module 9 NC + Module 5 actions)

**Logique** :
- Programme d'audit pluriannuel généré au démarrage du tenant
- Couverture obligatoire : tous les processus audités sur 3 ans (§9.2.2)
- Grille d'audit générée à partir du référentiel ISO + processus

**Critères de validation** :
- Programme 3 ans pré-rempli au démarrage
- Création d'un audit avec sélection processus
- Grille d'audit générée
- Rapport d'audit éditable
- Écarts → NC + actions automatiques

---

### Module 11 — Revues de processus + Revue de direction

**Écrans** :
- `/revues/processus` : revues planifiées + réalisées par processus
- `/revues/processus/[id]` : détail revue
- `/revues/direction` : revues annuelles
- `/revues/direction/[id]` : détail RDD

**Logique RDD** :
- Préparation automatique : compile inputs §9.3.2 (KPI, NC, audits, satisfaction, R&O, retours clients, etc.)
- Animation : template d'ordre du jour
- Sortie : décisions, actions → injection dans Module 5
- Approbation : signature DG, snapshot figé

**Critères de validation** :
- RDD annuelle créée automatiquement (entrée pré-remplie)
- Compte-rendu généré, approuvé, snapshot
- Décisions converties en actions traçables

---

### Module 12 — Risques & Opportunités

**Écrans** :
- `/risques` : registre R&O avec matrice de cotation (gravité × probabilité)
- `/risques/[id]` : détail R&O + traitement + actions liées

**Logique** :
- Cotation : criticité = gravité × probabilité
- Affichage matrice : zone rouge (criticité > 15) → action obligatoire
- Revue annuelle obligatoire (notification)
- Lien processus + actions de traitement

**Critères de validation** :
- Création / édition R&O
- Matrice visuelle correcte
- Lien avec actions de traitement
- Revue annuelle déclenche notif

---

### Module 13 — Parties intéressées + Contexte

**Écrans** :
- `/strategie/contexte` : SWOT + PESTEL éditeur
- `/strategie/parties-prenantes` : registre PI

**Init** : template PI SI/ESN typique (clients grands comptes, candidats, sous-traitants consultants, autorités URSSAF, etc.)

**Critères de validation** :
- Édition contexte avec format structuré
- Registre PI complet
- Revue annuelle déclenche notif

---

### Module 14 — Enquêtes satisfaction

**Écrans** :
- `/satisfaction` : liste enquêtes
- `/satisfaction/[id]` : config + résultats
- `/satisfaction/nouvelle` : création

**v1 MVP** :
- Création d'enquête depuis template (NPS mission, satisfaction annuelle, etc.)
- Connexion aux formulaires existants Flowise (Suivi prestation, Suivi consultant) — récupération données via webhook ou API
- Visualisation résultats (taux réponse, NPS, scores moyens)

**v2** :
- Création formulaire from scratch dans l'app
- Envoi automatique aux clients/consultants
- Analyse IA des verbatims

**Critères de validation** :
- Création / pilotage enquête
- Connexion forms externes existants (webhook)
- KPI satisfaction auto-mis-à-jour

---

### Module 15 — Calendrier qualité

**Écrans** :
- `/calendrier` : vue mensuelle / annuelle de tous les événements
- Liste à venir, en cours, passés

**Événements affichés** :
- Audits internes planifiés
- Audits externes (surveillance, renouvellement)
- Revues de direction annuelles
- Revues de processus annuelles
- Comités qualité périodiques
- Formations
- Échéances d'actions
- Échéances de documents à réviser

**Critères de validation** :
- Vue calendrier moderne (FullCalendar.js ou équivalent)
- Création / édition d'événement
- Notifications J-60, J-30, J-7 fonctionnelles

---

### Module 16 — Veille réglementaire

**Écrans** :
- `/veille` : liste des textes applicables
- `/veille/[id]` : détail texte + impact + actions

**v1 MVP** : saisie manuelle des textes par Léa

**v2** : intégration d'un flux de veille (API Legifrance, AFNOR, etc.)

**Critères de validation** :
- Création / édition d'un texte de veille
- Lien vers actions / processus impactés

---

### Module 17 — Plaintes & Réclamations

**Écrans** :
- `/reclamations` : liste
- `/reclamations/[id]` : détail + traitement

**Workflow** :
1. Saisie réclamation client
2. Analyse → décision NC ? (si oui → injection Module 9)
3. Traitement, réponse client
4. Évaluation satisfaction post-traitement
5. Clôture

**Critères de validation** :
- Workflow complet
- Lien possible vers NC + actions

---

## 10. Intégration BoondManager

### 10.1 Authentification — OAuth 2.0 confirmé

Confirmé via la documentation officielle BoondManager (help.boondmanager.com/fr/articles/602691-connexion-oauth2) :

- **Standard OAuth 2.0 — Authorization Code Flow**
- **Credentials récupérés** : `client_id`, `client_secret`, `authorization_url`, `access_token_url`
- **Création d'une seule application Flowise** côté BoondManager (espace développeur, gratuit)
- **Scopes (endpoints) sélectionnables** via le champ "API Autorisées" lors de la création de l'application
- **Bearer Token** classique : `Authorization: Bearer <access_token>`

### 10.1 bis Architecture multi-tenant pour Flowise

Modèle : 1 application Flowise centrale + 1 autorisation OAuth par client.

```
Setup Flowise (1 fois) :
  ├─ Création app "Flowise Pilotage SMQ" dans espace dev BoondManager
  ├─ Récupération CLIENT_ID + CLIENT_SECRET (stockés en env vars Vercel)
  ├─ Configuration redirect_uri : https://app.flowise.fr/api/boond/callback
  └─ Sélection scopes : consultants, missions, clients, factures, opportunités

Onboarding d'un nouveau client tenant :
  ├─ Le DG client clique "Connecter BoondManager" dans son tenant
  ├─ Redirection vers https://app.boondmanager.com/oauth/authorize?client_id=<flowise>&...
  ├─ Le DG se logue sur Boond et autorise notre app
  ├─ Boond redirige vers /api/boond/callback?code=<authorization_code>
  ├─ Notre Edge Function échange le code contre un access_token spécifique à ce client
  ├─ Stockage du token (encrypted) dans tenants.boond_oauth_token
  └─ Toutes les requêtes API utilisent CE token, isolé par tenant
```

- Stockage du refresh token côté Supabase (encrypted via `pgsodium` ou Supabase Vault)
- Auto-refresh des tokens via Edge Function (à la demande, avant chaque sync)

### 10.2 Endpoints utilisés (à confirmer après échange avec BoondManager)

| Endpoint | Donnée récupérée | Fréquence sync |
|---|---|---|
| `/api/resources` | Liste consultants (effectif, statut, ancienneté) | Quotidien |
| `/api/positionings` | Missions actives, durées | Quotidien |
| `/api/companies` | Clients Boond | Hebdomadaire |
| `/api/billing` | Factures / CA | Mensuel |
| `/api/opportunities` | Pipeline commercial | Hebdomadaire |
| `/api/applicants` | Candidats | Hebdomadaire |

### 10.3 Architecture sync

```
┌──────────────────────┐
│ Vercel Cron Job      │  (toutes les heures pour effectif/missions)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Edge Function Supabase           │
│ • Pour chaque tenant actif       │
│ • Refresh token si expiré        │
│ • Appel endpoints Boond          │
│ • Stockage raw data en cache     │
│ • Calcul des indicateurs dérivés │
│ • Insert / update indicateurs    │
└──────────────────────────────────┘
```

### 10.4 KPI calculés

| KPI | Calcul | Endpoint source |
|---|---|---|
| Taux inter-contrat | (consultants_sans_mission / total_consultants) × 100 | /resources |
| Effectif total | Count consultants actifs | /resources |
| Nb missions actives | Count missions status="active" | /positionings |
| CA mensuel | Sum factures du mois | /billing |
| Taux transformation | (opportunites_gagnees / opportunites_total) × 100 | /opportunities |
| Délai mise en mission | Moyenne(date_mission - date_proposition) | /positionings + /opportunities |

### 10.5 Onboarding d'un client Boond

1. Dans `Admin Flowise → Clients → [Tenant] → Intégrations`
2. Clic "Connecter BoondManager"
3. Redirection vers OAuth Boond
4. Client (DG) autorise l'accès
5. Tokens stockés, première sync immédiate
6. Configuration des KPI à activer / désactiver
7. Vérification : effectif Boond doit matcher effectif déclaré dans le tenant

### 10.6 Fallback si pas d'accès Boond

Si un client n'utilise pas BoondManager (cas rare en SI/ESN mais possible) :
- Saisie manuelle des indicateurs
- Onboarding plus long mais possible

---

## 11. Architecture des routes Next.js (App Router)

### 11.1 Structure des fichiers

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── select-tenant/page.tsx
│   └── layout.tsx
├── (admin)/                      # Admin Flowise only
│   ├── clients/
│   │   ├── page.tsx              # Liste tenants
│   │   └── [id]/
│   │       ├── page.tsx          # Drill-down tenant
│   │       └── edit/page.tsx
│   └── layout.tsx
├── (tenant)/                     # Routes accessibles dans un tenant
│   ├── dashboard/
│   │   └── page.tsx
│   ├── strategie/
│   │   ├── politique/page.tsx
│   │   ├── objectifs/page.tsx
│   │   ├── contexte/page.tsx
│   │   └── parties-prenantes/page.tsx
│   ├── processus/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── documentation/
│   │   └── procedures/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           ├── edit/page.tsx
│   │           └── versions/page.tsx
│   ├── actions/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── nouvelle/page.tsx
│   ├── conformite/
│   │   ├── page.tsx
│   │   └── [chapitre]/page.tsx
│   ├── indicateurs/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── nc/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── audits/
│   │   ├── programme/page.tsx
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── revues/
│   │   ├── processus/page.tsx
│   │   └── direction/page.tsx
│   ├── risques/page.tsx
│   ├── parties-prenantes/page.tsx
│   ├── satisfaction/page.tsx
│   ├── calendrier/page.tsx
│   ├── veille/page.tsx
│   ├── reclamations/page.tsx
│   ├── parametres/page.tsx
│   └── layout.tsx
├── api/
│   ├── boond/
│   │   ├── callback/route.ts      # OAuth callback
│   │   └── sync/route.ts           # Manual sync trigger
│   ├── notifications/
│   │   └── route.ts
│   └── webhooks/
│       └── route.ts
└── layout.tsx
```

### 11.2 Middleware

`middleware.ts` au root :
- Vérifie auth Supabase
- Vérifie tenant actif (sauf admin Flowise)
- Redirige vers `/login` ou `/select-tenant` si manquant
- Injecte tenant_id dans les headers pour les RSC

---

## 12. Composants UI réutilisables

### 12.1 Composants shadcn/ui à installer

`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Dialog`, `Sheet`, `Dropdown`, `Popover`, `Tabs`, `Card`, `Badge`, `Avatar`, `Toast`, `Skeleton`, `Pagination`, `Table`, `Form`

### 12.2 Composants custom (à coder)

#### Composants de données

- `<DataTable>` : tableau générique avec tri, filtres, pagination, basé sur TanStack Table
- `<KpiCard>` : card affichant un KPI (valeur, évolution, sparkline)
- `<KpiChart>` : graphique d'évolution d'un KPI (Recharts)
- `<EmptyState>` : message quand aucune donnée
- `<EntityList>` : liste générique avec actions
- `<EntityCard>` : card générique pour un objet SMQ

#### Composants documents maîtrisés

- `<TiptapEditor>` : éditeur de texte riche (avec mentions, liens internes)
- `<DocumentHeader>` : header avec titre, statut, version
- `<VersionHistory>` : timeline des versions d'un document
- `<SignatureCapture>` : pop-up de signature (mot de passe + confirmation)
- `<ApprovalWorkflow>` : composant de workflow Brouillon → Publié

#### Composants navigation & layout

- `<TenantSwitcher>` : dropdown pour switcher tenant (admin)
- `<Sidebar>` : navigation latérale avec sections collapsable
- `<TopBar>` : barre du haut avec notifs + user menu
- `<Breadcrumbs>` : fil d'ariane
- `<TabNav>` : tabs de navigation interne (ex: dans détail processus)

#### Composants spécifiques SMQ

- `<ProcessusMap>` : visualisation cartographie processus
- `<ConformityMatrix>` : matrice de conformité ISO par chapitre
- `<RiskMatrix>` : matrice R&O (gravité × probabilité)
- `<FiveWhysGuided>` : analyse 5 pourquoi guidée
- `<IshikawaDiagram>` : diagramme Ishikawa
- `<KanbanBoard>` : kanban drag-and-drop pour actions
- `<TimelineCalendar>` : timeline événements qualité

#### Composants notifications

- `<NotificationBell>` : cloche avec compteur non-lu
- `<NotificationCenter>` : panneau latéral avec liste

### 12.3 Design tokens

```ts
// tailwind.config.ts extends
colors: {
  primary: { ... }, // Coral Flowise #FF5A5F
  text: { ... },    // Midnight #0B1120
  surface: { ... }, // Slate-100 #F1F5F9
  // statuts SMQ
  status: {
    conforme: '#10B981',
    pa: '#F59E0B',
    nc_mineure: '#EF4444',
    nc_majeure: '#7F1D1D',
    pf: '#3B82F6',
  }
}
```

---

## 13. Plan de développement séquentiel

### Phase 0 — Setup (Semaine 1)

- Init repo Git
- Install Next.js 15 + TypeScript + Tailwind
- Setup Supabase project (DB + Auth)
- Setup Vercel deployment
- Install shadcn/ui + composants de base
- Setup ESLint, Prettier
- Première CI verte

### Phase 1 — Foundation (Semaines 2-3)

- **Auth** : login email + magic link
- **Tables** : `tenants`, `profiles`, RLS policies
- **Multi-tenant** : middleware, contexte, switching admin Flowise
- **Layout** : Sidebar + TopBar + structure de pages
- **Composants UI de base** : DataTable, EmptyState, EntityList, etc.

### Phase 2 — Cœur SMQ (Semaines 4-7)

- **Module 2 — Processus** (création + détail + cartographie)
- **Module 5 — Plan d'action** (CRUD + filtres + Kanban + init 80 actions)
- **Module 9 — NC** (CRUD + 5 pourquoi guidé)
- **Module 3 — Politique qualité** (premier document maîtrisé)
- **Workflow doc maîtrisé** (Brouillon → Publié + signature + snapshots) — réutilisable

### Phase 3 — Pilotage (Semaines 8-11)

- **Module 4 — Procédures** (multiple instances de doc maîtrisé)
- **Module 7 — Indicateurs** (manuel d'abord)
- **Module 8 — Intégration BoondManager** (OAuth + sync + indicateurs auto)
- **Module 6 — Auto-évaluation conformité** (référentiel ISO + cotation)

### Phase 4 — Audits & Revues (Semaines 12-14)

- **Module 10 — Audits internes** (programme + planning + rapports)
- **Module 11 — Revues** (processus + direction)
- **Module 12 — R&O** (registre + matrice)
- **Module 13 — Parties prenantes & Contexte**

### Phase 5 — Périphérique (Semaines 15-16)

- **Module 14 — Satisfaction** (connexion forms externes)
- **Module 15 — Calendrier qualité**
- **Module 16 — Veille réglementaire** (CRUD simple)
- **Module 17 — Réclamations**

### Phase 6 — Notifications & Polish (Semaine 17)

- **Module Notifications** complet (in-app + email + digest)
- **Branding Flowise** final (logo, couleurs, polices)
- **Tests E2E critiques** (Playwright)
- **Documentation utilisateur** (FAQ in-app)

### Phase 7 — Beta avec Léa (Semaines 18-22)

- Déploiement en production
- Léa onboarde 1-2 clients tests
- Itération sur retours quotidiens
- Corrections de bugs
- Ajustements UX

### Total estimé : ~22 semaines (~5 mois) pour MVP utilisable par Léa

---

## 14. Critères de validation MVP

### 14.1 Fonctionnels

- [ ] Léa peut créer un nouveau tenant en 5 min
- [ ] Le tenant est initialisé avec : processus, procédures brouillon, 80 actions, RDD à planifier, programme audit 3 ans
- [ ] Connexion BoondManager fonctionnelle (avec 1 client test)
- [ ] Au moins 10 KPI sont auto-remplis depuis Boond
- [ ] Le DG client peut se connecter, voir son dashboard, approuver des documents
- [ ] Workflow doc maîtrisé : politique qualité publiée v1.0 avec signature
- [ ] Création d'une NC + analyse 5 pourquoi + action corrective + clôture
- [ ] Création d'un audit interne planifié + rapport + écarts → actions
- [ ] Vue conformité ISO : 100% des chapitres listés, cotation modifiable
- [ ] Notifications fonctionnelles (in-app + email)

### 14.2 Techniques

- [ ] Pas de cross-tenant data leak (testé avec 2 tenants distincts)
- [ ] Performance : page chargée en < 2s avec 100 enregistrements
- [ ] Mobile responsive (au moins lisible sur tablette)
- [ ] Backup quotidien automatique (Supabase)
- [ ] Logs d'erreurs centralisés (Sentry ou équivalent)
- [ ] Tests E2E : login, création tenant, workflow doc maîtrisé, NC, audit

### 14.3 Métier

- [ ] Léa valide que l'outil lui permet de piloter 5 clients en parallèle
- [ ] Un auditeur externe (simulé par Léa) peut consulter la conformité ISO et juger qu'elle est démontrable
- [ ] Le DG client comprend l'outil sans formation dépassant 30 min

---

## 15. Conventions de code

### 15.1 Naming

- **Fichiers** : kebab-case (`processus-card.tsx`)
- **Composants** : PascalCase (`ProcessusCard`)
- **Variables/fonctions** : camelCase
- **Types/interfaces** : PascalCase avec préfixe `T` ou `I` optionnel
- **Constantes** : UPPER_SNAKE_CASE
- **DB** : snake_case (tables, colonnes)

### 15.2 Structure des composants

```tsx
// Préférer Server Components par défaut
// 'use client' uniquement quand nécessaire (interactivité, hooks)

// Co-localisation : un composant = un dossier
// composants/processus-card/
//   ├── processus-card.tsx
//   ├── processus-card.test.tsx
//   └── index.ts (re-export)
```

### 15.3 Data fetching

- **Pages SSR** : fetch côté serveur dans le component principal
- **Mutations** : Server Actions ou API routes
- **State client** : TanStack Query pour cache
- **Forms** : React Hook Form + Zod schémas

### 15.4 Gestion erreurs

- Toast user-friendly pour les erreurs métier
- Log Sentry pour les erreurs techniques
- Pas d'`alert()`, pas de `console.log` en prod

### 15.5 Documentation

- JSDoc sur les fonctions utilitaires complexes
- Pas de commentaires "ce que ça fait" sur le code évident
- README à la racine + dans chaque module si logique non triviale

---

## 16. Annexes

### Annexe A — Référentiel ISO 9001:2015 (extrait)

Le référentiel complet à insérer en DB dans la table `referentiel_iso`. Format type :

```yaml
- chapitre: "4.1"
  intitule: "Compréhension de l'organisme et de son contexte"
  description: "L'organisme doit déterminer les enjeux externes et internes pertinents..."
  exigences:
    - "Identifier les enjeux internes pertinents"
    - "Identifier les enjeux externes pertinents"
    - "Surveiller et revoir ces enjeux"
  preuves_attendues: "Analyse SWOT/PESTEL documentée, revue annuelle"
  domaine: "contexte"
  est_obligatoire: true
  ordre_affichage: 1
```

À pré-remplir avec les ~40 chapitres et sous-chapitres ISO 9001 pertinents.

### Annexe B — Templates SI/ESN par défaut

Au démarrage d'un nouveau tenant, l'outil pré-remplit :

- **8-12 processus** types (cf. Module 2)
- **15-20 procédures** brouillons (revue d'offre, mise en mission, audit interne, etc.)
- **80 actions standards** ISO 9001 (depuis bibliothèque)
- **15-20 indicateurs** types (cf. Module 7)
- **10-15 R&O** types (concentration commerciale, dépendance fournisseurs, etc.)
- **8-12 parties intéressées** types
- **Politique qualité brouillon** type
- **Programme audit 3 ans** type
- **Calendrier événements** annuel type

À constituer collaborativement avec Léa pendant la phase de spec.

### Annexe C — Données BoondManager — schéma de mapping

À compléter après confirmation API par BoondManager.

### Annexe D — Glossaire SMQ

- **SMQ** : Système de Management de la Qualité
- **SI** : Société d'Ingénierie
- **AT** : Assistance Technique
- **ESN** : Entreprise de Services du Numérique
- **NC** : Non-Conformité
- **PA** : Point d'Attention
- **PF** : Point Fort
- **RDD** : Revue de Direction
- **R&O** : Risques et Opportunités
- **KPI** : Key Performance Indicator
- **§ ISO** : Chapitre ISO
- **RLS** : Row Level Security (Postgres)

---

## Fin du CDC v1

**Document à valider par Léa avant développement.**

Prochaines étapes :
1. Lecture + retours Léa
2. Ajustements CDC v1.1
3. Confirmation accès API BoondManager
4. Démarrage Phase 0 (setup) avec Claude Code
