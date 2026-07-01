// Domaines d'un système SSE (MASE §1.3/§1.4 : les objectifs et indicateurs
// doivent couvrir Sécurité, Santé et Environnement). « qualite » complète pour
// un système intégré QSSE.

export const DOMAINES_SSE = ["securite", "sante", "environnement"] as const;
export type DomaineSse = (typeof DOMAINES_SSE)[number] | "qualite";

export const DOMAINE_SSE_LABELS: Record<DomaineSse, string> = {
  securite: "Sécurité",
  sante: "Santé",
  environnement: "Environnement",
  qualite: "Qualité",
};
