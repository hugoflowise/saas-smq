// ============================================================================
// Libellés « norm-aware » : source unique pour que les intitulés, sigles et
// chapitres référencés s'adaptent aux normes actives d'un client.
//
// Décision produit (2026-07-01) :
//   - une seule famille de management → libellé propre (qualité / SSE / …) ;
//   - au moins deux familles cumulées → libellé intégré « QSSE ».
//
// Les pages (composants serveur) chargent les normes via getNormesActives()
// puis passent ces libellés au PageHeader — inutile de modifier PageHeader.
// ============================================================================

import { NORMES, type NormeCode } from "./modules";

type Famille = (typeof NORMES)[number]["famille"];

/** Familles de management distinctes couvertes par les normes actives. */
function famillesActives(normes: readonly string[]): Famille[] {
  const set = new Set<Famille>();
  for (const n of NORMES) if (normes.includes(n.code)) set.add(n.famille);
  return [...set];
}

/**
 * Suffixe de domaine du système de management (« qualité », « SSE », « QSSE »…)
 * selon les familles actives. Sert à composer « Politique {…} », « Objectifs {…} ».
 */
export function domaineLabel(normes: readonly string[]): string {
  const f = famillesActives(normes);
  if (f.length >= 2) return "QSSE";
  switch (f[0]) {
    case "sst":
      return "SSE";
    case "environnement":
      return "environnement";
    case "radioprotection":
      return "radioprotection";
    default:
      return "qualité"; // famille qualité ou aucune norme (repli 9001)
  }
}

/** Sigle du système de management (remplace le « SMQ » câblé en dur). */
export function systemeSigle(normes: readonly string[]): string {
  const f = famillesActives(normes);
  if (f.length >= 2) return "QSSE";
  switch (f[0]) {
    case "sst":
      return "SSE"; // système de management SSE (MASE / 45001)
    case "environnement":
      return "SME";
    case "radioprotection":
      return "SMR";
    default:
      return "SMQ";
  }
}

/** Intitulé complet du système de management (ex. « système de management SSE »). */
export function systemeLabel(normes: readonly string[]): string {
  const f = famillesActives(normes);
  if (f.length >= 2) return "système de management QSSE";
  switch (f[0]) {
    case "sst":
      return "système de management SSE";
    case "environnement":
      return "système de management environnemental";
    case "radioprotection":
      return "système de management de la radioprotection";
    default:
      return "système de management de la qualité";
  }
}

export function politiqueLabel(normes: readonly string[]): string {
  return `Politique ${domaineLabel(normes)}`;
}

export function objectifsLabel(normes: readonly string[]): string {
  return `Objectifs ${domaineLabel(normes)}`;
}

// Libellés de navigation dépendant des normes : quand l'intitulé du menu porte
// le domaine (« Politique qualité »), on le recompose. Les autres restent tels
// quels (retour du libellé par défaut).
const NAV_LABEL_OVERRIDES: Record<string, (normes: readonly string[]) => string> = {
  "/strategie/politique": politiqueLabel,
};

export function navLabel(href: string, defaultLabel: string, normes: readonly string[]): string {
  return NAV_LABEL_OVERRIDES[href]?.(normes) ?? defaultLabel;
}

// --- Chapitres / articles référencés par concept et par norme --------------
// Un concept transverse (ex. « politique ») pointe vers un chapitre différent
// selon la norme. Le badge liste ceux des normes actives, dans l'ordre NORMES.

const NORME_PREFIX: Record<NormeCode, string> = {
  "9001": "ISO 9001",
  "14001": "ISO 14001",
  "45001": "ISO 45001",
  MASE: "MASE",
  CEFRI: "CEFRI",
};

// Chapitres MASE : précis pour l'Axe 1 (lu en détail) ; niveau « Axe N » pour
// les axes 2 à 5 (on ne sur-précise pas les sous-numéros non vérifiés).
const CLAUSES: Record<string, Partial<Record<NormeCode, string>>> = {
  politique: { "9001": "§5.2", "14001": "§5.2", "45001": "§5.2", MASE: "§1.2" },
  objectifs: { "9001": "§6.2", "14001": "§6.2", "45001": "§6.2", MASE: "§1.3 et §1.4" },
  indicateurs: { "9001": "§9.1.1", MASE: "§1.4" },
  actions: { "9001": "§10", MASE: "§1.6.1" },
  documents: { "9001": "§7.5", MASE: "§1.6.2" },
  communications: { "9001": "§7.4", MASE: "§1.7" },
  reunions: { "9001": "§7.4 et §9.3", MASE: "§1.7" },
  audits: { "9001": "§9.2", MASE: "Axe 4" },
  revue: { "9001": "§9.3", MASE: "Axe 5" },
  remontees: { "9001": "§9.1.2 et §10.2", MASE: "§1.5.14 et Axe 4" },
  effectif: { "9001": "§7.1 et §9.1.1", MASE: "Axe 2" },
  competences: { "9001": "§7.2", MASE: "Axe 2" },
  dashboard: { "9001": "§9.1", MASE: "Axe 4" },
  suiviConsultant: { "9001": "§7.1 et §9.1", MASE: "Axe 3" },
  systeme: { "9001": "§4.4", "14001": "§4.4", "45001": "§4.4", MASE: "Axe 1" },
};

/**
 * Badge multi-normes des chapitres liés à un concept, ex.
 * « ISO 9001 §5.2 · MASE §1.2 ». Renvoie undefined si aucune norme active n'a
 * de chapitre associé (le PageHeader n'affiche alors pas de badge).
 */
export function clauseBadge(concept: string, normes: readonly string[]): string | undefined {
  const map = CLAUSES[concept];
  if (!map) return undefined;
  const parts = NORMES.filter((n) => normes.includes(n.code) && map[n.code]).map(
    (n) => `${NORME_PREFIX[n.code]} ${map[n.code]}`,
  );
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/**
 * Badge listant simplement les référentiels actifs (ex. « ISO 9001 · MASE »),
 * pour les pages transverses à toutes les normes (auto-diagnostic, mode audit).
 */
export function referentielsBadge(normes: readonly string[]): string | undefined {
  const parts = NORMES.filter((n) => normes.includes(n.code)).map((n) => NORME_PREFIX[n.code]);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
