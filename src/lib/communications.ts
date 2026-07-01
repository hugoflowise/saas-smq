/**
 * Communications (ISO 9001 §7.4) : modèles d'e-mails type + helpers d'envoi.
 *
 * L'envoi se fait via un lien `mailto:` qui ouvre le client de messagerie
 * (Outlook…) avec l'objet et le corps préremplis, prêt à relire et envoyer.
 */

import { TIMEZONE } from "./format";

/** Catégories de modèles. */
export const MODELE_CATEGORIES: Record<string, string> = {
  qualite: "Qualité",
  securite: "Sécurité",
  epi: "EPI",
  formation: "Formations",
  odm: "Ordres de mission",
  rh: "RH",
  reunion: "Réunions",
  autre: "Autre",
};

export type ModelePiece = { path: string; nom: string; taille: number; type: string };

export type Modele = {
  id: string;
  categorie: string;
  titre: string;
  objet: string;
  corps: string;
  /** true pour les modèles fournis (non supprimables, mais duplicables). */
  integre?: boolean;
  /** Pièces jointes du modèle (uniquement pour les modèles personnalisés). */
  pieces?: ModelePiece[];
};

/**
 * Variables remplaçables dans l'objet et le corps : `{cle}` est remplacé par
 * la valeur saisie au moment de l'envoi.
 */
export const VARIABLES: { cle: string; label: string }[] = [
  { cle: "societe", label: "Nom de la société" },
  { cle: "date", label: "Date du jour" },
];

/** Remplace les variables `{cle}` dans un texte. Les clés absentes sont laissées telles quelles. */
export function appliquerVariables(texte: string, valeurs: Record<string, string>): string {
  return texte.replace(/\{(\w+)\}/g, (match, cle) =>
    valeurs[cle] != null && valeurs[cle] !== "" ? valeurs[cle] : match,
  );
}

/** Date du jour au format FR (pour la variable {date}). */
export function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", { timeZone: TIMEZONE });
}

/** Construit un lien mailto (objet + corps préremplis). `to` peut être vide. */
export function construireMailto(opts: { to?: string; objet: string; corps: string }): string {
  const params = new URLSearchParams();
  if (opts.objet) params.set("subject", opts.objet);
  if (opts.corps) params.set("body", opts.corps);
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${encodeURIComponent(opts.to ?? "")}${query ? `?${query}` : ""}`;
}

/** Modèles fournis (point de départ, personnalisables par duplication). */
export const MODELES_INTEGRES: Modele[] = [
  {
    id: "qualite-politique",
    categorie: "qualite",
    titre: "Diffusion de la politique qualité",
    objet: "Politique qualité de {societe}",
    integre: true,
    corps:
      "Bonjour,\n\nVous trouverez ci-joint la politique qualité de {societe}, qui définit nos engagements et nos objectifs.\n\nMerci d'en prendre connaissance. Je reste à votre disposition pour toute question.\n\nBien cordialement,",
  },
  {
    id: "qualite-procedure",
    categorie: "qualite",
    titre: "Nouvelle procédure applicable",
    objet: "Nouvelle procédure applicable",
    integre: true,
    corps:
      "Bonjour,\n\nUne nouvelle procédure entre en application. Merci d'en prendre connaissance et de l'appliquer dès à présent.\n\nElle est disponible dans notre système documentaire. N'hésitez pas à revenir vers moi pour toute précision.\n\nBien cordialement,",
  },
  {
    id: "securite-consigne",
    categorie: "securite",
    titre: "Consigne de sécurité",
    objet: "Consigne de sécurité",
    integre: true,
    corps:
      "Bonjour,\n\nDans le cadre de notre démarche de prévention, merci de respecter la consigne de sécurité suivante :\n\n- \n\nVotre vigilance est essentielle pour la sécurité de tous.\n\nBien cordialement,",
  },
  {
    id: "epi-rappel",
    categorie: "epi",
    titre: "Rappel : port des EPI",
    objet: "Rappel : port des équipements de protection individuelle",
    integre: true,
    corps:
      "Bonjour,\n\nNous vous rappelons que le port des équipements de protection individuelle (EPI) est obligatoire sur les zones concernées.\n\nMerci de vérifier l'état de vos EPI et de signaler tout besoin de remplacement.\n\nBien cordialement,",
  },
  {
    id: "formation-convocation",
    categorie: "formation",
    titre: "Convocation à une formation",
    objet: "Convocation à une formation le {date}",
    integre: true,
    corps:
      "Bonjour,\n\nVous êtes convié(e) à une formation le {date}.\n\n- Intitulé : \n- Lieu : \n- Horaires : \n\nVotre présence est importante. Merci de me confirmer votre participation.\n\nBien cordialement,",
  },
  {
    id: "odm-transmission",
    categorie: "odm",
    titre: "Transmission d'un ordre de mission",
    objet: "Ordre de mission",
    integre: true,
    corps:
      "Bonjour,\n\nVeuillez trouver les éléments de votre ordre de mission :\n\n- Client / site : \n- Dates : \n- Objet de la mission : \n\nMerci de vérifier ces informations et de me signaler toute anomalie.\n\nBien cordialement,",
  },
  {
    id: "reunion-invitation",
    categorie: "reunion",
    titre: "Invitation réunion QHSE",
    objet: "Invitation : réunion QHSE le {date}",
    integre: true,
    corps:
      "Bonjour,\n\nVous êtes invité(e) à la prochaine réunion QHSE le {date}.\n\n- Lieu : \n- Ordre du jour : \n\nMerci de confirmer votre présence.\n\nBien cordialement,",
  },
];
