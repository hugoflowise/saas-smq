// ============================================================================
// Registre central du multi-normes : quelles normes existent, et quels modules
// (entrées de navigation) sont visibles selon les normes activées d'un client.
//
// Trois niveaux d'exigence par module :
//   - "socle"   : toujours visible (transverse + obligations légales, ex. DUERP)
//   - "systeme" : visible dès qu'au moins une norme est active (management commun
//                 à toutes les normes : politique, objectifs, plan d'actions,
//                 audits, veille, remontées, revue, auto-diagnostic…)
//   - { normes }: visible si l'une de ces normes est active (tronc ISO Annexe SL
//                 réservé aux normes ISO, ou module métier propre à une norme)
//
// Un href non listé est traité comme "systeme" → aucun module existant n'est
// masqué pour les clients actuels (tous en 9001). Le masquage ne concerne pour
// l'instant que les clients d'autres normes (ex. MASE seul).
// ============================================================================

export type NormeCode = "9001" | "14001" | "45001" | "MASE" | "CEFRI";

export type NormeInfo = {
  code: NormeCode;
  /** Libellé complet (sélecteur admin). */
  label: string;
  /** Libellé court (badge). */
  court: string;
  /** Famille de management, pour regrouper. */
  famille: "qualite" | "environnement" | "sst" | "radioprotection";
};

export const NORMES: NormeInfo[] = [
  { code: "9001", label: "ISO 9001 - Qualité", court: "9001", famille: "qualite" },
  { code: "14001", label: "ISO 14001 - Environnement", court: "14001", famille: "environnement" },
  {
    code: "45001",
    label: "ISO 45001 - Santé & sécurité au travail",
    court: "45001",
    famille: "sst",
  },
  {
    code: "MASE",
    label: "MASE - Sécurité (santé, sécurité, environnement)",
    court: "MASE",
    famille: "sst",
  },
  { code: "CEFRI", label: "CEFRI - Radioprotection", court: "CEFRI", famille: "radioprotection" },
];

const NORME_CODES = new Set<string>(NORMES.map((n) => n.code));

/**
 * Correspondance code de norme → valeurs `norme` acceptées dans `referentiel_iso`
 * (l'auto-diagnostic). On liste les variantes de libellé possibles (le 9001
 * historique a pu être seedé sous « ISO 9001 », « ISO 9001:2015 » ou « 9001 »)
 * pour ne jamais vider par erreur un référentiel déjà en base.
 */
export const REFERENTIEL_NORMES: Record<NormeCode, string[]> = {
  "9001": ["ISO 9001", "ISO 9001:2015", "9001"],
  "14001": ["ISO 14001", "14001"],
  "45001": ["ISO 45001", "45001"],
  MASE: ["MASE"],
  CEFRI: ["CEFRI"],
};

/** Normes valides (filtre les entrées inconnues d'un tableau de codes). */
export function normalizeNormes(codes: readonly string[]): NormeCode[] {
  return codes.filter((c): c is NormeCode => NORME_CODES.has(c));
}

type Requirement = "socle" | "systeme" | { normes: NormeCode[] };

// Normes ISO à structure Annexe SL (High Level Structure) : elles partagent le
// même tronc « système de management » (contexte §4.1, parties intéressées §4.2,
// domaine §4.3, approche processus §4.4, R&O §6.1, modifications §6.3,
// non-conformités §10.2…). MASE n'est PAS une norme Annexe SL (structure en
// 5 axes) : ces modules-là doivent être masqués pour un client MASE seul.
const ISO_ANNEXE_SL: NormeCode[] = ["9001", "14001", "45001"];

// Modules transverses / obligations légales : toujours visibles, indépendamment
// des normes (un client a toujours au moins ces entrées).
const MODULE_REQUIREMENTS: Record<string, Requirement> = {
  "/dashboard": "socle",
  "/mise-en-route": "socle",
  "/calendrier": "socle",
  "/reunions": "socle",
  "/mode-audit": "socle",
  "/effectif": "socle",
  "/journal": "socle",
  "/parametres": "socle",
  "/corbeille": "socle",
  "/utilisateurs": "socle",
  // DUERP (document unique) : obligation légale dès 1 salarié, indépendante de
  // toute certification → socle, visible pour tous (MASE s'appuie dessus mais ne
  // le « possède » pas). À brancher quand le module sera livré.
  // "/duerp": "socle",

  // --- Tronc « système de management » ISO Annexe SL (masqué pour MASE seul) ---
  "/strategie/contexte": { normes: ISO_ANNEXE_SL }, // §4.1 enjeux internes/externes
  "/strategie/domaine": { normes: ISO_ANNEXE_SL }, // §4.3 domaine d'application
  "/strategie/parties-prenantes": { normes: ISO_ANNEXE_SL }, // §4.2 parties intéressées
  "/risques": { normes: ISO_ANNEXE_SL }, // §6.1 R&O stratégiques (≠ l'AdR par mission MASE)
  "/modifications-smq": { normes: ISO_ANNEXE_SL }, // §6.3 modifications planifiées
  "/processus": { normes: ISO_ANNEXE_SL }, // §4.4 approche processus
  "/nc": { normes: ISO_ANNEXE_SL }, // §10.2 non-conformités (MASE : écarts + remontées)

  // --- Modules métier ISO 9001 (masqués pour un client SST/environnement seul) ---
  "/suivi-prestation": { normes: ["9001"] }, // satisfaction client §9.1.2
  "/fournisseurs": { normes: ["9001"] }, // achats / évaluation fournisseurs §8.4

  // --- Modules métier à venir (exemples du gating ciblé) ---
  // "/sst/plans-prevention": { normes: ["MASE", "45001"] },
  // "/sst/accidents": { normes: ["MASE", "45001"] },
  // "/environnement/aspects": { normes: ["14001"] },
};

/** Un module est-il visible pour un client donné (selon ses normes actives) ? */
export function isModuleVisible(href: string, normesActives: readonly string[]): boolean {
  const req = MODULE_REQUIREMENTS[href] ?? "systeme";
  if (req === "socle") return true;
  if (req === "systeme") return normesActives.length > 0;
  return req.normes.some((n) => normesActives.includes(n));
}
