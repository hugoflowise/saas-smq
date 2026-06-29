/**
 * Table de correspondance endpoints BoondManager → entités de l'app.
 *
 * Données indicatives à confirmer au rdv (les chemins exacts dépendent de la
 * version d'API et des scopes accordés). Ce module ne sert qu'à documenter et
 * cadrer le futur branchement ; il ne déclenche aucun appel.
 *
 * Voir docs/integration-boond.md (section « Mapping des données »).
 */

/** Une ligne de correspondance Boond → app. */
export type BoondMappingRow = {
  /** Endpoint Boond pressenti (à confirmer). */
  endpoint: string;
  /** Entité / table cible dans l'app. */
  cible: string;
  /** Champs Boond → champs app (clé : champ app, valeur : chemin Boond). */
  champs: Record<string, string>;
  /** Clause ISO / module concerné. */
  module: string;
  /** Statut de confirmation des chemins. */
  statut: "à confirmer" | "confirmé";
};

/**
 * Correspondances pressenties. À mettre à jour après le rdv (endpoints réels,
 * pagination, scopes). Tous les `statut` sont « à confirmer » par défaut.
 */
export const BOOND_MAPPING: readonly BoondMappingRow[] = [
  {
    endpoint: "/resources",
    cible: "public.consultants",
    champs: {
      reference: "resource.id",
      nom: "resource.lastName",
      prenom: "resource.firstName",
      entite: "resource.agency.name",
      poste: "resource.title",
    },
    module: "Effectif (couverture ODM/PDP/visites)",
    statut: "à confirmer",
  },
  {
    endpoint: "(défini par indicateurs.boond_endpoint)",
    cible: "public.indicateur_mesures",
    champs: {
      valeur: "(agrégat selon l'indicateur)",
    },
    module: "Indicateurs (source = boondmanager)",
    statut: "à confirmer",
  },
  {
    endpoint: "/resources/{id} (diplômes / habilitations)",
    cible: "futur module Compétences (§7.2)",
    champs: {
      intitule: "training/certification.label",
      echeance: "certification.expirationDate",
    },
    module: "Compétences (§7.2) — masqué tant que non alimenté",
    statut: "à confirmer",
  },
  {
    endpoint: "/opportunities, /orders, /contracts",
    cible: "Revue d'engagement (§8.2.3)",
    champs: {
      reference: "opportunity.reference",
      montant: "order.turnoverInvoicedExcludingTax",
    },
    module: "Revue d'engagement (devis/commande/contrat)",
    statut: "à confirmer",
  },
] as const;
