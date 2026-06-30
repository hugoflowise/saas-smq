# Remontées — diffusion & adoption terrain

> Enjeu : le formulaire de remontée existe (`/enquete/[token]/signalement`,
> même mécanique que les suivis), mais il ne sert à rien tant qu'il n'est pas
> **dans les mains** des business managers (BM) et consultants **au bon moment**.
> Ce document trace la stratégie de diffusion, ce qui est livré, et le plan
> canal Boond (Phase 3).

## Le problème

La carte « Partager le formulaire » vit **dans l'app**, donc seule la personne
qualité (ex. Léa) la voit. Or un BM (commercial) ou un consultant terrain
n'ouvrira jamais l'app Flowise pour faire une remontée. Deux besoins distincts :

1. **Le leur mettre en main** (push) — leur envoyer le lien.
2. **Le garder sous la main** (persistance) — qu'ils le retrouvent au quotidien.

## Ce qui est livré (pont de diffusion — utile tout de suite, fallback permanent)

Composant partagé **`src/components/share-form-card.tsx`** (`ShareFormCard`),
utilisé par Remontées (`/reclamations`) et les deux suivis
(`/suivi-prestation`, `/suivi-consultant`) — harmonisation demandée (retour #47) :

- QR code + lien copiable + « Ouvrir le formulaire » (existant, factorisé) ;
- **« Inviter par e-mail »** : `mailto:` pré-rempli (objet + texte + lien) que la
  personne qualité envoie aux BM/consultants. Zéro config. *(Une version envoi
  automatique via Resend pourra suivre.)*

Composant **`src/components/add-to-home-screen-hint.tsx`** affiché sous chaque
formulaire public (signalement + suivis) : aide « Ajouter à l'écran d'accueil »
avec détection iOS/Android. C'est la réponse « sous la main au quotidien » sur
mobile : le consultant scanne une fois → icône one-tap.

### Pistes non encore faites (à arbitrer)

- **Affiche QR imprimable (PDF A4)** à punaiser en agence / mettre dans les
  véhicules — réutiliserait la génération PDF existante (chromium).
- **Snippet de signature e-mail** prêt à coller pour les BM.

## Plan canal Boond (Phase 3 — accès partenariat pas encore actifs)

**Décision d'architecture :** ne **PAS** recréer le formulaire dans Boond.
Le recréer par client serait ingérable, **et** exclurait tous les clients qui ne
sont pas sur Boond (tous les prospects qualité ne sont pas des ESN).

→ **Le formulaire Flowise reste la source unique. Boond devient un *canal*, pas
un *moteur*.** Le BM/consultant a déjà Boond ouvert toute la journée : on
distribue la remontée *là où il travaille déjà*, via l'API (OAuth 2.0 par
client, cf. `docs/integration-boond.md` sur `feat/boond-groundwork`). Sans jamais
rebâtir de formulaire :

1. **Pré-remplissage par contexte mission** — depuis une mission Boond, le lien
   Flowise est déjà contextualisé (client, mission, déclarant identifié). Bonus :
   on récupère enfin `declarant_nom / declarant_email / declarant_role`
   automatiquement (souvent vides aujourd'hui).
2. **Renvoi de la remontée dans Boond** — la remontée créée dans Flowise est
   repoussée comme action/note sur la mission Boond → traçable côté BM.
3. **Le lien là où ils vivent déjà** — exposer le lien dans Boond (champ,
   widget, ou signature) plutôt que via QR/mail.

Coût par client = **une connexion OAuth** (un clic d'autorisation), templatable
— pas du form-building.

### Séquence

- **Maintenant** : pont de diffusion (ci-dessus) — bridge immédiat **et**
  fallback permanent pour les clients non-Boond.
- **Phase 3** (accès Boond obtenus) : brancher le canal API par-dessus le **même**
  formulaire Flowise, pour les clients ESN uniquement.

> Boond ne remplace pas le formulaire : il le distribue mieux pour une partie des
> clients. Le formulaire standalone reste indispensable.
