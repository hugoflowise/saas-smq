// ============================================================================
// Modèle de parties prenantes conseillé pour une société d'ingénierie / ESN.
// Prérempli à la création d'un client (marqué « proposé · à valider ») : le
// client doit revoir, ajuster, supprimer puis valider chaque ligne. Cote de
// saillance par défaut (Pouvoir / Légitimité / Urgence, chacun de 1 à 3).
// ISO 9001 §4.2.
// ============================================================================

type Sphere = "interne" | "externe";
type Interaction = "faible" | "moyenne" | "forte" | "elevee";
type PiType = "client" | "fournisseur" | "collaborateur" | "autorite" | "actionnaire" | "autre";

export type PartiePrenanteStandard = {
  nom: string;
  type: PiType;
  sphere: Sphere;
  niveauInteraction: Interaction;
  pouvoir: number;
  legitimite: number;
  urgence: number;
};

export const PARTIES_PRENANTES_STANDARDS: PartiePrenanteStandard[] = [
  {
    nom: "Dirigeants & associés",
    type: "actionnaire",
    sphere: "interne",
    niveauInteraction: "forte",
    pouvoir: 3,
    legitimite: 3,
    urgence: 3,
  },
  {
    nom: "Collaborateurs",
    type: "collaborateur",
    sphere: "interne",
    niveauInteraction: "forte",
    pouvoir: 2,
    legitimite: 3,
    urgence: 3,
  },
  {
    nom: "Clients",
    type: "client",
    sphere: "externe",
    niveauInteraction: "forte",
    pouvoir: 2,
    legitimite: 2,
    urgence: 3,
  },
  {
    nom: "Prospects",
    type: "client",
    sphere: "externe",
    niveauInteraction: "forte",
    pouvoir: 2,
    legitimite: 2,
    urgence: 2,
  },
  {
    nom: "Candidats",
    type: "autre",
    sphere: "externe",
    niveauInteraction: "forte",
    pouvoir: 1,
    legitimite: 2,
    urgence: 2,
  },
  {
    nom: "Fournisseurs / sous-traitants",
    type: "fournisseur",
    sphere: "externe",
    niveauInteraction: "moyenne",
    pouvoir: 2,
    legitimite: 1,
    urgence: 2,
  },
  {
    nom: "Prestataires externes",
    type: "fournisseur",
    sphere: "externe",
    niveauInteraction: "forte",
    pouvoir: 2,
    legitimite: 1,
    urgence: 2,
  },
  {
    nom: "Partenaires",
    type: "autre",
    sphere: "externe",
    niveauInteraction: "moyenne",
    pouvoir: 1,
    legitimite: 1,
    urgence: 2,
  },
  {
    nom: "État / Collectivités territoriales",
    type: "autorite",
    sphere: "externe",
    niveauInteraction: "moyenne",
    pouvoir: 2,
    legitimite: 2,
    urgence: 3,
  },
  {
    nom: "Autorité de contrôle",
    type: "autorite",
    sphere: "externe",
    niveauInteraction: "elevee",
    pouvoir: 3,
    legitimite: 2,
    urgence: 3,
  },
  {
    nom: "Institutions financières",
    type: "autre",
    sphere: "externe",
    niveauInteraction: "moyenne",
    pouvoir: 3,
    legitimite: 3,
    urgence: 3,
  },
  {
    nom: "Concurrence",
    type: "autre",
    sphere: "externe",
    niveauInteraction: "faible",
    pouvoir: 1,
    legitimite: 1,
    urgence: 1,
  },
  {
    nom: "Médias",
    type: "autre",
    sphere: "externe",
    niveauInteraction: "moyenne",
    pouvoir: 2,
    legitimite: 2,
    urgence: 2,
  },
];
