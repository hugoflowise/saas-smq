/**
 * Configuration de la corbeille (page `/corbeille`).
 *
 * Décrit, pour chaque table à suppression logique porteuse de preuves, comment
 * l'afficher : libellé de catégorie, colonnes à charger, et comment construire
 * l'identifiant lisible (code/référence/intitulé selon la table). Source unique
 * partagée entre la page (requêtes + rendu) et les actions.
 */

import type { SoftDeletableTable } from "@/lib/actions/soft-delete";

/** Ligne générique remontée d'une table en corbeille (colonnes connues). */
export type CorbeilleRawRow = {
  id: string;
  deleted_at: string | null;
  [key: string]: unknown;
};

export type CorbeilleTableConfig = {
  table: SoftDeletableTable;
  /** Libellé de la catégorie (regroupement dans la page). */
  label: string;
  /** Colonnes à sélectionner (en plus de id + deleted_at, toujours chargées). */
  columns: string[];
  /** Construit l'identifiant lisible (intitulé) d'une ligne. */
  intitule: (row: CorbeilleRawRow) => string;
  /** Code / référence court affiché à côté de l'intitulé (optionnel). */
  reference?: (row: CorbeilleRawRow) => string | null;
};

/** Première valeur texte non vide parmi des colonnes candidates. */
function texte(row: CorbeilleRawRow, ...cols: string[]): string | null {
  for (const c of cols) {
    const v = row[c];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return null;
}

/**
 * Tables couvertes par la corbeille, dans l'ordre d'affichage. On privilégie
 * les tables porteuses de preuves d'audit (documents, enregistrements, NC,
 * actions, fournisseurs, consultants…). `pi_attentes` (sous-objet d'une partie
 * prenante) et `enquetes_satisfaction` (restaurées depuis leur module dédié)
 * ne sont volontairement pas listées ici pour rester lisible.
 */
export const CORBEILLE_CONFIG: CorbeilleTableConfig[] = [
  {
    table: "documents_maitrise",
    label: "Documents maîtrisés",
    columns: ["code", "titre", "type", "statut"],
    intitule: (r) => texte(r, "titre") ?? "Document",
    reference: (r) => texte(r, "code"),
  },
  {
    table: "procedures",
    label: "Procédures",
    columns: ["code", "titre", "objet", "description_courte"],
    intitule: (r) => texte(r, "titre", "objet", "description_courte") ?? "Procédure",
    reference: (r) => texte(r, "code"),
  },
  {
    table: "processus",
    label: "Processus",
    columns: ["code", "nom", "description"],
    intitule: (r) => texte(r, "nom", "description") ?? "Processus",
    reference: (r) => texte(r, "code"),
  },
  {
    table: "actions",
    label: "Plan d'actions",
    columns: ["reference", "description_courte"],
    intitule: (r) => texte(r, "description_courte") ?? "Action",
    reference: (r) => texte(r, "reference"),
  },
  {
    table: "evenements_qualite",
    label: "Non-conformités & événements qualité",
    columns: ["titre", "description"],
    intitule: (r) => texte(r, "titre", "description") ?? "Événement qualité",
  },
  {
    table: "risques_opportunites",
    label: "Risques & opportunités",
    columns: ["intitule"],
    intitule: (r) => texte(r, "intitule") ?? "Risque / opportunité",
  },
  {
    table: "fournisseurs",
    label: "Fournisseurs",
    columns: ["nom"],
    intitule: (r) => texte(r, "nom") ?? "Fournisseur",
  },
  {
    table: "consultants",
    label: "Consultants",
    columns: ["nom", "reference"],
    intitule: (r) => texte(r, "nom") ?? "Consultant",
    reference: (r) => texte(r, "reference"),
  },
  {
    table: "parties_interessees",
    label: "Parties prenantes",
    columns: ["nom"],
    intitule: (r) => texte(r, "nom") ?? "Partie prenante",
  },
  {
    table: "indicateurs",
    label: "Indicateurs",
    columns: ["nom", "description"],
    intitule: (r) => texte(r, "nom", "description") ?? "Indicateur",
  },
  {
    table: "reunions",
    label: "Réunions QHSE",
    columns: ["titre"],
    intitule: (r) => texte(r, "titre") ?? "Réunion",
  },
  {
    table: "veille_reglementaire",
    label: "Veille réglementaire",
    columns: ["intitule", "reference"],
    intitule: (r) => texte(r, "intitule") ?? "Veille",
    reference: (r) => texte(r, "reference"),
  },
  {
    table: "jalons_certification",
    label: "Jalons de certification",
    columns: ["libelle"],
    intitule: (r) => texte(r, "libelle") ?? "Jalon",
  },
  {
    table: "communication_modeles",
    label: "Modèles de communication",
    columns: ["titre", "objet"],
    intitule: (r) => texte(r, "titre", "objet") ?? "Modèle",
  },
];

/** Tables autorisées à la restauration depuis la page corbeille (sécurité). */
export const CORBEILLE_TABLES: SoftDeletableTable[] = CORBEILLE_CONFIG.map((c) => c.table);
