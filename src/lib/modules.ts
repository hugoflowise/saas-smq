// ============================================================================
// Registre central du multi-normes : quelles normes existent, et quels modules
// (entrées de navigation) sont visibles selon les normes activées d'un client.
//
// Trois niveaux d'exigence par module :
//   - "socle"   : toujours visible (transverse + obligations légales, ex. DUERP)
//   - "systeme" : visible dès qu'au moins une norme est active (tronc commun,
//                 type Annexe SL : politique, objectifs, processus, audits…)
//   - { normes }: visible si l'une de ces normes est active (module métier)
//
// Un href non listé est traité comme "systeme" (tronc commun) → aucun module
// existant n'est masqué pour les clients actuels (tous en 9001).
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

/** Normes valides (filtre les entrées inconnues d'un tableau de codes). */
export function normalizeNormes(codes: readonly string[]): NormeCode[] {
  return codes.filter((c): c is NormeCode => NORME_CODES.has(c));
}

type Requirement = "socle" | "systeme" | { normes: NormeCode[] };

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
  // toute certification → socle.
  "/duerp": "socle",
  //
  // Modules métier (à venir) - exemples du gating ciblé :
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
