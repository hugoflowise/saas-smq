# Intégration BoondManager — architecture & préparation

> **Statut : PRÉPARATION.** Le code, la migration et l'UI livrés sont **inertes** :
> aucun appel réseau réel, aucune UI active n'appelle Boond. Le branchement réel
> est conditionné aux accès obtenus auprès de BoondManager (voir la
> [checklist du rdv](#à-obtenir--demander-à-boond-rdv)).

BoondManager est l'ERP des sociétés de conseil / ESN (consultants, opportunités,
devis/commandes/contrats, facturation). L'objectif est d'alimenter
automatiquement plusieurs modules du SMQ à partir des données déjà saisies dans
Boond par le client, sans double saisie.

---

## 1. Modèle multi-tenant — « chaque client voit-il bien ses données ? » → OUI

L'authentification BoondManager est **par compte**. Concrètement :

- Chaque client Flowise possède **son propre compte BoondManager** (un compte =
  une entreprise = ses propres consultants, opportunités, etc.).
- On stocke **ses identifiants de connexion par tenant** (table `tenants`, voir
  [§5 Sécurité](#5-sécurité-des-secrets) et la migration
  `20260629180000_boond_connexion.sql`).
- Tout appel à l'API est signé avec les identifiants **du tenant courant**
  (`getTenantContext().effectiveTenantId`) → la réponse de Boond ne contient que
  les données de ce compte.

→ **L'isolation est native** : il n'existe aucun chemin par lequel le compte
Boond du client A renverrait des données du client B, puisque les jetons sont
distincts et propres à chaque compte. Côté app, on conserve par ailleurs le
filtre `tenant_id` (RLS) sur toutes les tables de destination.

```
Tenant A ──(jetons A)──► JWT signé clé A ──► API Boond ──► données du compte A
Tenant B ──(jetons B)──► JWT signé clé B ──► API Boond ──► données du compte B
```

---

## 2. Modes d'authentification — comparaison & recommandation

Source vérifiée : connecteur de référence
[`pyboondmanager`](https://github.com/tominardi/pyboondmanager)
(`boondmanager/auth.py`, `docs/pages/basics.md`).

### Format du JWT (vérifié)

```
header    = { "alg": "HS256", "typ": "JWT" }
payload   = { "userToken": …, "clientToken": …, "time": <unix_s>, "mode": "normal" }
signature = HMAC_SHA256( base64url(header) + "." + base64url(payload), <clé> )
jwt       = base64url(header) "." base64url(payload) "." base64url(signature)
```

- **4 champs de payload, dans cet ordre** : `userToken`, `clientToken`, `time`,
  `mode`. `time` = timestamp UNIX en secondes (création) ; **pas d'expiration**
  posée dans le payload côté Boond — on régénère un JWT à chaque appel.
- `mode` vaut `"normal"` par défaut (`"god"` existe pour un accès élargie).
- En **mode App**, le champ payload `clientToken` reçoit l'**appToken** ; ce qui
  distingue App de Client est **l'en-tête HTTP** porteur, pas le payload.

| Élément | App-JWT | Client-JWT |
|---|---|---|
| En-tête HTTP | `X-Jwt-App-BoondManager` | `X-Jwt-Client-BoondManager` |
| Jeton secondaire (payload) | `appToken` (fourni par Boond à l'install.) | `clientToken` (developer space) |
| Clé de signature HMAC | `appKey` (admin client > apps > votre app) | `clientKey` (developer space > API/Sandbox) |
| `userToken` | réglages utilisateur > sécurité | idem |

### Comparaison

| Critère | **App-JWT** (recommandé) | Client-JWT | OAuth2 | Basic auth |
|---|---|---|---|---|
| Adapté SaaS multi-clients | Oui : 1 app enregistrée, chaque client l'installe | Partiel : pensé pour un intégrateur unique | Oui si flux supporté | Non |
| Onboarding client | Client installe l'app → fournit son `appKey` + `userToken` | Client communique clés developer space | Redirection consentement | Login/mdp (à proscrire) |
| Secret en clair échangé | Tokens (à chiffrer) | Tokens (à chiffrer) | Refresh token (à chiffrer) | Mot de passe (rédhibitoire) |
| Révocation | Désinstallation de l'app côté client | Rotation des clés | Révocation du consentement | — |
| Maturité côté Boond | Confirmée (header dédié) | Confirmée | **À confirmer** (variables d'env présentes) | Existant mais déconseillé |

### Recommandation

**App-JWT.** On enregistre **une** app « Flowise Pilotage SMQ » côté BoondManager
(obtention d'un `appToken`). Chaque client l'installe sur son compte, ce qui lui
fournit une `appKey` propre. Le client renseigne dans Flowise : son `userToken`
et son `appKey` ; nous conservons l'`appToken` global de l'app. Avantages : un
seul enregistrement à maintenir, onboarding self-service, révocation par simple
désinstallation côté client.

> **À valider au rdv** : Boond peut recommander un **flux OAuth2** (les variables
> `BOOND_AUTHORIZATION_URL` / `BOOND_ACCESS_TOKEN_URL` / `BOOND_REDIRECT_URI` sont
> déjà prévues côté config). Si OAuth2 est le chemin officiel pour un éditeur
> SaaS, on bascule l'onboarding vers ce flux (le wrapper `client.ts` reste
> valable, seule la fabrique d'en-tête change).

---

## 3. Onboarding client (écran « Paramètres → Intégration Boond »)

Écran déjà ébauché (désactivé) dans `/parametres`. Cible :

1. **Connecter** : le dirigeant saisit `userToken` + `appKey` (mode App), ou suit
   la redirection OAuth2 si retenu. Une action serveur valide les identifiants
   par un appel test (ex. `GET /resources?maxResults=1`) puis enregistre
   `boond_auth_mode`, les tokens (chiffrés), `boond_connected_at`,
   `boond_sync_status = 'connecte'`.
2. **Statut** : affiche connecté / non connecté / erreur (`boond_sync_status`),
   `boond_last_sync_at`, et `boond_last_sync_error` le cas échéant.
3. **Déconnecter** : efface les tokens et repasse `boond_sync_status` à
   `non_connecte` (la désinstallation de l'app côté Boond reste l'acte de
   révocation côté ERP).

---

## 4. Mapping des données Boond → entités de l'app

Table machine : `src/lib/boond/mapping.ts` (chemins **à confirmer** au rdv).

| Endpoint Boond (pressenti) | Entité / table app | Champs principaux | Module |
|---|---|---|---|
| `GET /resources` | `public.consultants` | `id→reference`, `lastName→nom`, `firstName→prenom`, `agency.name→entite`, `title→poste` | Effectif (couverture ODM/PDP/visites) |
| endpoint défini par `indicateurs.boond_endpoint` | `indicateur_mesures` (source `boondmanager`) | agrégat → `valeur` | Indicateurs |
| `GET /resources/{id}` (diplômes / habilitations) | futur module **Compétences (§7.2)** | `label→intitulé`, `expirationDate→échéance` | Compétences (masqué tant que non alimenté) |
| `GET /opportunities`, `/orders`, `/contracts` | **Revue d'engagement (§8.2.3)** | `reference`, montants | Revue d'engagement (devis/commande/contrat) |

Existant déjà prévu côté schéma :
`tenants.boond_account_id`, `tenants.boond_oauth_token`,
`indicateurs.boond_endpoint`, enum `indicateur_source = ('manuel','boondmanager','calcul')`,
`consultants.reference` (clé d'import Boond).

---

## 5. Sécurité des secrets

- Les tokens (`boond_user_token`, `boond_app_token`, `boond_app_key`,
  `boond_oauth_token`) sont des **secrets**. Ils ne sont **JAMAIS** sélectionnés
  dans une page ou une action renvoyée au client : lecture **côté serveur
  uniquement** via `createAdminClient()`.
- **À activer avant mise en service : chiffrement Supabase Vault.** Plan :
  1. Stocker chaque secret comme un secret Vault (`vault.create_secret`), ne
     conserver dans `tenants` que la **référence** (ou chiffrer la colonne).
  2. Déchiffrer à la volée côté serveur au moment de signer le JWT.
  3. Restreindre l'accès Vault au rôle service (clé service role), jamais au rôle
     `anon`/`authenticated`.
- La clé `appKey`/`clientKey` sert de **clé de signature HMAC** : sa fuite permet
  de forger des JWT du compte → criticité maximale.

> La migration `20260629180000_boond_connexion.sql` stocke ces colonnes en clair
> (nullable) pour préparer le terrain ; un commentaire SQL rappelle l'obligation
> de chiffrement Vault avant toute connexion réelle.

---

## 6. Synchronisation

- **À la demande** : bouton « Synchroniser » dans le module concerné (effectif,
  indicateurs) → appel ponctuel scoppé au tenant.
- **Périodique** : tâche planifiée (cron Vercel / Edge Function Supabase) parcourt
  les tenants `boond_sync_status = 'connecte'` et rafraîchit les données. Met à
  jour `boond_last_sync_at`.
- **Gestion d'erreurs** : en cas d'échec, passer `boond_sync_status = 'erreur'`,
  écrire `boond_last_sync_error`, et émettre une notification de type
  **`boond_sync_error`** (type déjà présent en base). Le wrapper renvoie une
  `BoondApiError` typée (statut HTTP + corps) exploitable par l'appelant.
- **Idempotence** : l'`upsert` sur `consultants` se fait via la clé
  `(tenant_id, reference)` (index unique déjà présent).

---

## À obtenir / demander à Boond (rdv)

Checklist actionnable :

1. **Enregistrement de notre app** « Flowise Pilotage SMQ » + obtention de
   l'**`appToken`** (et procédure d'installation côté client → génération
   `appKey`).
2. **Accès Sandbox** (compte de test + jeux de données) et **URL de base** de
   l'API à confirmer (`https://ui.boondmanager.com/api` ?) + URL Sandbox.
3. **Mode d'auth officiel** pour un éditeur SaaS : **App-JWT** confirmé, ou
   **OAuth2** recommandé ? Si OAuth2 : scopes, URLs authorize/token, `redirect_uri`
   à déclarer, durée de vie / refresh token.
4. **Endpoints exacts** dont nous avons besoin :
   - consultants / **ressources** (effectif) ;
   - **diplômes / habilitations / compétences** (module §7.2) ;
   - **opportunités / devis / commandes / contrats** (revue d'engagement §8.2.3) ;
   - endpoints d'**indicateurs** / agrégats (pour `indicateurs.boond_endpoint`).
5. **Périmètre / scopes** accordés par mode d'auth (lecture seule suffit-elle ?).
6. **Limites de débit (rate limits)** : quota par compte/app, fenêtre, en-têtes de
   throttling, comportement en 429.
7. **Webhooks** éventuels (notification de changement côté Boond) vs polling.
8. **Pagination & format** des réponses (JSON:API ? `maxResults`/`page` ?).
9. **Conditions du partenariat technique** : référencement marketplace, support,
   versionnage d'API, SLA, coût éventuel.

---

## Annexe — briques de code livrées (inertes)

| Fichier | Rôle |
|---|---|
| `src/lib/boond/types.ts` | Types des identifiants par tenant + réponses minimales |
| `src/lib/boond/jwt.ts` | Construction des JWT App / Client (HS256), fonctions pures |
| `src/lib/boond/jwt.test.ts` | Tests unitaires du builder JWT |
| `src/lib/boond/client.ts` | Wrapper `fetch` (URL base + en-tête JWT + erreurs typées) — **ne pas appeler** |
| `src/lib/boond/mapping.ts` | Table endpoints Boond → entités app |
| `supabase/migrations/20260629180000_boond_connexion.sql` | Colonnes de connexion par tenant (additive) |
| `src/app/(tenant)/parametres/page.tsx` | Section « Intégration Boond » **désactivée** |
