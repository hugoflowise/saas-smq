/** Libellés et helpers de la liste maîtresse des documents (R13). */

export const DOC_MAITRISE_TYPE_LABELS: Record<string, string> = {
  manuel: "Manuel",
  procedure: "Procédure",
  instruction: "Instruction de travail",
  enregistrement: "Enregistrement",
  formulaire: "Formulaire",
  document_externe: "Document externe",
  autre: "Autre",
};

/** Statut unifié affiché dans la liste maîtresse (sources natives + registre). */
export const DOC_STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  en_vigueur: "En vigueur",
  archive: "Archivé",
};

export const DOC_STATUT_CLASS: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  en_revue: "bg-status-pa/15 text-status-pa",
  en_vigueur: "bg-status-conforme/15 text-status-conforme",
  archive: "bg-muted text-muted-foreground",
};

/** Normalise le statut d'un document maîtrisé natif (document_statut) vers le statut unifié. */
export function statutDocumentNatif(statut: string): string {
  if (statut === "publiee" || statut === "approuvee") return "en_vigueur";
  if (statut === "archivee") return "archive";
  if (statut === "en_revue") return "en_revue";
  return "brouillon";
}
