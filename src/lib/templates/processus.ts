/**
 * Cartographie processus standard SI/ESN, injectée à la création d'un tenant
 * (CDC Annexe B / Module 2). Personnalisable ensuite par le client.
 */
export type ProcessusType = "pilotage" | "realisation" | "support";

export const PROCESSUS_STANDARDS: { nom: string; type: ProcessusType }[] = [
  // Pilotage
  { nom: "Direction", type: "pilotage" },
  { nom: "SMQ", type: "pilotage" },
  // Réalisation
  { nom: "Recrutement", type: "realisation" },
  { nom: "Commercial", type: "realisation" },
  { nom: "Suivi de projets", type: "realisation" },
  // Support
  { nom: "RH", type: "support" },
  { nom: "Communication", type: "support" },
  { nom: "Finance & Achat", type: "support" },
];
