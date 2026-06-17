/**
 * Cartographie processus standard SI/ESN, injectée à la création d'un tenant
 * (CDC Annexe B / Module 2). Personnalisable ensuite par le client.
 */
export type ProcessusType = "pilotage" | "realisation" | "support";

export const PROCESSUS_STANDARDS: { nom: string; type: ProcessusType }[] = [
  // Pilotage
  { nom: "Pilotage stratégique", type: "pilotage" },
  { nom: "Management de la qualité", type: "pilotage" },
  { nom: "Communication", type: "pilotage" },
  // Réalisation
  { nom: "Commercial", type: "realisation" },
  { nom: "Recrutement", type: "realisation" },
  { nom: "Mise en mission", type: "realisation" },
  { nom: "Suivi de prestation", type: "realisation" },
  { nom: "Fin de mission", type: "realisation" },
  // Support
  { nom: "Ressources humaines", type: "support" },
  { nom: "Infrastructure", type: "support" },
  { nom: "Achats", type: "support" },
  { nom: "Systèmes d'information", type: "support" },
  { nom: "Finance", type: "support" },
];
