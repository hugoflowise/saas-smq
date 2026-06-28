/**
 * Codification documentaire (convention Léa) : `{FAMILLE}_{PROCESSUS}_{CHRONO}`,
 * ex. `DG_SMQ_004`, `PR_DIR_002`, `EN_SMQ_001`. On ne gère que la documentation
 * **interne** (4 familles), jamais l'externe. Le compteur chronologique est
 * indépendant par couple (famille, processus). Helpers purs (client + serveur) ;
 * le calcul du prochain numéro qui interroge la base est dans
 * `codification-server.ts`.
 */

/** Les 4 familles documentaires internes. */
export type FamilleDoc = "DG" | "PR" | "FO" | "EN";

export const FAMILLES_DOC: FamilleDoc[] = ["DG", "PR", "FO", "EN"];

export const FAMILLE_DOC_LABELS: Record<FamilleDoc, string> = {
  DG: "Document Général",
  PR: "Procédure",
  FO: "Formulaire",
  EN: "Enregistrement",
};

/** Aide au choix de la famille (exemples de Léa). */
export const FAMILLE_DOC_AIDE: Record<FamilleDoc, string> = {
  DG: "Politique, cartographie, fiches d'identité, lettres de mission, organigramme",
  PR: "Procédures : commerciale, recrutement, audit interne…",
  FO: "Formulaires vierges à remplir : offre commerciale, fiche de suivi, fiche NC…",
  EN: "Enregistrements / preuves : PV de revue, registres remplis, rapports d'audit",
};

/**
 * Type du registre manuel (`doc_maitrise_type`) → famille de codification.
 * `null` = non codifié automatiquement (documentation externe, divers).
 */
export const TYPE_MAITRISE_TO_FAMILLE: Record<string, FamilleDoc | null> = {
  manuel: "DG",
  procedure: "PR",
  instruction: "PR",
  enregistrement: "EN",
  formulaire: "FO",
  document_externe: null,
  autre: null,
};

const NUM_PAD = 3;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Assemble un code complet à partir de ses 3 segments. */
export function formatReference(
  famille: FamilleDoc,
  processusCode: string,
  chrono: number,
): string {
  return `${famille}_${processusCode}_${String(chrono).padStart(NUM_PAD, "0")}`;
}

/**
 * Extrait le numéro chronologique d'un code s'il correspond au préfixe
 * `{famille}_{processusCode}_`, sinon `null`. Insensible à la casse.
 */
export function chronoFromReference(
  code: string,
  famille: FamilleDoc,
  processusCode: string,
): number | null {
  const re = new RegExp(`^${famille}_${escapeRegExp(processusCode)}_(\\d+)$`, "i");
  const m = code.trim().match(re);
  return m ? Number.parseInt(m[1], 10) : null;
}

/** Normalise un trigramme de processus : majuscules, alphanumérique, max 6. */
export function normalizeTrigramme(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}
