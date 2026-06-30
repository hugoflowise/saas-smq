// Modèle de DUERP « proposé à valider » pour une société de conseil / ingénierie
// (ESN). Repris du DUERP de référence (Fortil Sud-Est, indice N), à ajuster par
// chaque client. Cotation : Gravité ∈ {2,4,8,16}, Fréquence ∈ {0,2,4,6,8},
// Maîtrise ∈ {1..4} (cf. src/lib/duerp.ts).
//
// ⚠️ Contenu PROPOSÉ : chaque client doit le relire et l'adapter à sa réalité.

export type DuerpModeleRisque = {
  danger: string;
  dommages: string;
  gravite: number;
  frequence: number;
  maitrise: number;
  actionsExistantes?: string;
  actionsAMettre?: string;
};

export type DuerpModeleUnite = {
  libelle: string;
  description?: string;
  risques: DuerpModeleRisque[];
};

const RISQUES_BUREAUX: DuerpModeleRisque[] = [
  {
    danger: "Travail sur poste informatisé, écran",
    dommages: "Fatigue, TMS, stress, maladie, baisse de la productivité, réduction de la vue",
    gravite: 2,
    frequence: 6,
    maitrise: 4,
    actionsExistantes: "Pauses, éclairages, sensibilisations",
  },
  {
    danger: "Posture de travail",
    dommages: "Fatigue & douleurs musculaires ou articulaires, TMS",
    gravite: 4,
    frequence: 6,
    maitrise: 4,
    actionsExistantes: "Pauses, fauteuils ergonomiques, sensibilisations",
  },
  {
    danger: "Ambiance thermique",
    dommages: "Fatigue ou inconfort dû à la température, malaise, baisse de la productivité",
    gravite: 2,
    frequence: 6,
    maitrise: 4,
    actionsExistantes: "Système de climatisation réversible des locaux en place",
  },
  {
    danger: "Ambiance sonore",
    dommages: "Fatigue, inconfort",
    gravite: 2,
    frequence: 6,
    maitrise: 4,
    actionsExistantes: "Sensibilisation",
  },
  {
    danger: "Ambiance lumineuse",
    dommages: "Fatigue, inconfort",
    gravite: 2,
    frequence: 6,
    maitrise: 4,
    actionsExistantes: "Installation de luminaires suivant la superficie des bureaux",
  },
  {
    danger: "Téléphone au volant",
    dommages: "Accident de la route, dommages corporels, matériels",
    gravite: 16,
    frequence: 4,
    maitrise: 3,
    actionsExistantes: "Sensibilisations",
    actionsAMettre: "Faire un rappel sur les risques routiers trimestriellement",
  },
  {
    danger: "Accident de trajet",
    dommages: "Dommages corporels, matériels",
    gravite: 16,
    frequence: 4,
    maitrise: 3,
    actionsExistantes: "Limitation des longs déplacements quotidiens, sensibilisations",
    actionsAMettre: "Faire un rappel de sensibilisation sur les risques routiers",
  },
  {
    danger: "Alcool, drogue",
    dommages: "Troubles comportementaux",
    gravite: 16,
    frequence: 2,
    maitrise: 3,
    actionsExistantes:
      "Interdiction d'alcool et de drogue dans les bureaux (règlement intérieur), sensibilisations",
    actionsAMettre: "Rappel sensibilisation interdiction alcool et drogue",
  },
  {
    danger: "Tabac et vapotage dans les bureaux",
    dommages: "Atteintes à la santé des autres, pathologies liées au tabac",
    gravite: 8,
    frequence: 2,
    maitrise: 3,
    actionsExistantes: "Interdiction de fumer dans les bureaux (affichage)",
    actionsAMettre: "Rappel sensibilisation contre le tabac et le vapotage dans les bureaux",
  },
  {
    danger: "Accidents domestiques sans gravité",
    dommages: "Blessures légères",
    gravite: 4,
    frequence: 2,
    maitrise: 4,
    actionsExistantes: "Trousse de secours à disposition",
    actionsAMettre: "Rappel de sensibilisation",
  },
  {
    danger: "Déplacement dans les locaux — escaliers",
    dommages: "Chute dans les escaliers",
    gravite: 4,
    frequence: 6,
    maitrise: 3,
    actionsExistantes: "Rampes et affichage",
    actionsAMettre: "Sensibilisation",
  },
  {
    danger: "Déplacement dans les locaux — plain-pied",
    dommages: "Chute de plain-pied",
    gravite: 4,
    frequence: 6,
    maitrise: 3,
    actionsExistantes: "Ergonomie des postes de travail, sensibilisation",
    actionsAMettre: "Sensibilisation",
  },
  {
    danger: "Déplacement dans les locaux — chute d'objet",
    dommages: "Chute d'objet",
    gravite: 4,
    frequence: 6,
    maitrise: 3,
    actionsExistantes: "Ergonomie des postes de travail, sensibilisation",
    actionsAMettre: "Sensibilisation",
  },
  {
    danger: "Intervention immédiate sur un feu",
    dommages: "Brûlures",
    gravite: 8,
    frequence: 2,
    maitrise: 3,
    actionsExistantes: "Contrôle périodique des moyens d'extinction par un organisme agréé",
    actionsAMettre: "Rappel de sensibilisation à l'utilisation des moyens d'extinction",
  },
  {
    danger: "Évacuation d'urgence",
    dommages: "Panique, stress, dommages corporels",
    gravite: 8,
    frequence: 2,
    maitrise: 3,
    actionsExistantes: "Sensibilisation, vérification périodique des balisages d'évacuation",
    actionsAMettre: "Sensibilisation à la gestion des situations d'urgence, types d'alarmes",
  },
  {
    danger: "Intervention sur une personne blessée",
    dommages: "Panique, stress",
    gravite: 8,
    frequence: 2,
    maitrise: 3,
    actionsExistantes: "Personnel SST, trousse de secours",
  },
  {
    danger: "Installations ou équipements électriques non conformes / défectueux",
    dommages: "Choc électrique",
    gravite: 8,
    frequence: 2,
    maitrise: 3,
    actionsExistantes: "Contrôle périodique des installations électriques par un organisme habilité",
    actionsAMettre: "Suivi du contrôle annuel de la conformité des installations électriques",
  },
  {
    danger: "Surtension / surintensité",
    dommages: "Incendie, explosion, dommages corporels et matériels",
    gravite: 8,
    frequence: 2,
    maitrise: 3,
    actionsExistantes: "Contrôle périodique des installations électriques par un organisme habilité",
    actionsAMettre: "Suivi du contrôle annuel de la conformité des installations électriques",
  },
];

export const DUERP_MODELE_ESN: DuerpModeleUnite[] = [
  {
    libelle: "Agence — bureaux, services administratifs et bureau d'études",
    description:
      "Personnel travaillant dans les locaux de l'agence (bureau exécutif, administratif, BE).",
    risques: RISQUES_BUREAUX,
  },
  {
    libelle: "Intervenants sur les sites clients",
    description: "Consultants en mission sur les sites des entreprises utilisatrices.",
    risques: [
      ...RISQUES_BUREAUX.map((r) => ({ ...r })),
      {
        danger: "Travaux en hauteur",
        dommages: "Chute, dommages corporels",
        gravite: 8,
        frequence: 4,
        maitrise: 3,
        actionsExistantes:
          "Formation et habilitation obligatoires pour le travail en hauteur, EPI mis à disposition",
        actionsAMettre: "Sensibilisation au droit de retrait",
      },
      {
        danger: "Manipulations électriques",
        dommages: "Électrisation, électrocution, incendie",
        gravite: 8,
        frequence: 4,
        maitrise: 3,
        actionsExistantes: "Habilitation électrique exigée, EPI mis à disposition",
      },
      {
        danger: "Travaux potentiellement dangereux et hors cadre de la mission",
        dommages: "ITT (incapacité temporaire de travail), dommages corporels",
        gravite: 8,
        frequence: 4,
        maitrise: 3,
        actionsExistantes: "Ordre de mission, sensibilisation au droit de retrait, visite sécurité",
        actionsAMettre: "Sensibilisation au droit de retrait",
      },
      {
        danger: "Travaux avec de la manutention",
        dommages: "TMS, dommages corporels",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes: "Habilitation / formation obligatoire, sensibilisation au droit de retrait",
        actionsAMettre: "Sensibilisation au droit de retrait",
      },
      {
        danger: "Travaux sur site industriel à fortes nuisances sonores",
        dommages: "Surdité professionnelle, perte d'audition",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes: "EPI mis à disposition, visites sécurité",
        actionsAMettre: "Sensibilisation au respect des procédures clients",
      },
      {
        danger: "Travaux sur site industriel à risque chimique important",
        dommages: "Maladie, incendie, explosion",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes: "Formation obligatoire, EPI mis à disposition",
        actionsAMettre: "Sensibilisation au respect des procédures clients",
      },
      {
        danger: "Risque d'exposition interne et externe (rayonnement)",
        dommages: "Dommages corporels, maladie",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes:
          "Formation, EPI, catégorisation des intervenants avec la médecine du travail, surveillance individuelle renforcée, suivi de dose, port de dosimètres",
        actionsAMettre: "Surveillance et maintien du système",
      },
      {
        danger: "Intervention en zone contrôlée sans autorisation préalable",
        dommages: "Dommages corporels, maladie",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes: "Formation, sensibilisation, process interne « démarrage en zone »",
        actionsAMettre: "Rappel des process internes",
      },
      {
        danger: "Risque Radon sur site client",
        dommages: "Dommages corporels, maladie",
        gravite: 8,
        frequence: 4,
        maitrise: 3,
        actionsExistantes:
          "Évaluation de l'exposition lors d'un accès en zone radon, port de dosimètre individuel si exposition > 6 mSv",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Travail de nuit",
        dommages: "Troubles du sommeil, perturbation de la vie sociale, baisse de la vigilance, fatigue",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes:
          "Respect de la réglementation sur le temps de repos, sensibilisation, ordre de mission spécifique",
      },
    ],
  },
  {
    libelle: "Risques psychosociaux (RPS)",
    description: "Risques liés à l'organisation, aux relations de travail et au vécu des salariés.",
    risques: [
      {
        danger: "Position d'inter-contrat",
        dommages: "Impact psychologique, sentiment de faible productivité, découragement",
        gravite: 2,
        frequence: 6,
        maitrise: 3,
        actionsExistantes:
          "Suivi des sorties de mission, points d'intermission, affectation à des tâches internes (BE, support)",
        actionsAMettre:
          "Promouvoir la formation interne en intermission, développer une direction technique de support",
      },
      {
        danger: "Harcèlement",
        dommages: "Impact psychologique, stress, fatigue",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes:
          "Référent harcèlement, visite sécurité, sensibilisation, dispositif de remontée de situation dangereuse",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Surcharge de travail",
        dommages: "Burn out, impact psychologique, stress, fatigue",
        gravite: 4,
        frequence: 4,
        maitrise: 3,
        actionsExistantes:
          "Visite sécurité, dispositif d'écoute mensuel, sensibilisation RPS, dispositif de remontée",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Mauvaise organisation",
        dommages: "Fatigue, démotivation",
        gravite: 2,
        frequence: 4,
        maitrise: 3,
        actionsExistantes: "Visite sécurité, sensibilisation, dispositif de remontée",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Manque de communication de proximité avec la société",
        dommages: "Fatigue, démotivation",
        gravite: 2,
        frequence: 6,
        maitrise: 3,
        actionsExistantes: "Visite sécurité, sensibilisation, événements, dispositif de remontée",
        actionsAMettre: "Renforcer les événements collaboratifs",
      },
      {
        danger: "Imprécision de mission / rôles",
        dommages: "Fatigue, démotivation, stress",
        gravite: 2,
        frequence: 6,
        maitrise: 3,
        actionsExistantes: "Fiches de poste, ODM, kick-off meeting, visites sécurité",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Sous-charge de travail",
        dommages: "Bore out, impact psychologique",
        gravite: 4,
        frequence: 4,
        maitrise: 3,
        actionsExistantes: "Visite sécurité, dispositif d'écoute mensuel, sensibilisation RPS",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Perte du sens au travail",
        dommages: "Brown out, impact psychologique",
        gravite: 4,
        frequence: 4,
        maitrise: 3,
        actionsExistantes: "Visite sécurité, dispositif d'écoute mensuel, sensibilisation RPS",
        actionsAMettre: "Sensibilisation",
      },
      {
        danger: "Rapports sociaux, violences",
        dommages: "Dépression, anxiété, découragement, impact psychologique",
        gravite: 8,
        frequence: 2,
        maitrise: 3,
        actionsExistantes: "Visite sécurité, dispositif d'écoute mensuel, sensibilisation RPS",
        actionsAMettre: "Sensibilisation",
      },
    ],
  },
  {
    libelle: "Facteurs de pénibilité",
    description:
      "Facteurs de pénibilité réglementaires. Par défaut « aucune exposition » (G=16, F=0) — à coter si un facteur s'applique.",
    risques: [
      {
        danger: "Travail de nuit (éligible pénibilité)",
        dommages: "Troubles du sommeil, perturbation de la vie sociale, baisse de la vigilance",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Travail en équipes successives alternantes (éligible pénibilité)",
        dommages: "Troubles du sommeil, troubles cardiovasculaires, troubles psychologiques",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Travail répétitif (éligible pénibilité)",
        dommages: "Fatigue, contraintes psychologiques",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Activités en milieu hyperbare (éligible pénibilité)",
        dommages: "Barotraumatisme (poumons, oreilles, sinus), intoxication aux gaz, surdité, mort",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Manutentions manuelles de charges (éligible pénibilité)",
        dommages: "Douleurs lombaires, entorses, luxations, fractures, déformation physique",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Postures pénibles (éligible pénibilité)",
        dommages: "Lésions chroniques, entorses, chutes, fractures, handicap",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Vibrations mécaniques (éligible pénibilité)",
        dommages:
          "Troubles vasculaires, lésions ostéoarticulaires, troubles neurologiques, lombalgies, sciatiques",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Agents chimiques dangereux (éligible pénibilité)",
        dommages: "Maladies, intoxication, brûlure, irritation, décès",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Températures extrêmes (éligible pénibilité)",
        dommages: "Fatigue, maux de tête, vertige, troubles de la vigilance, décès",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
      {
        danger: "Bruit (éligible pénibilité)",
        dommages: "Perte auditive, fatigue auditive, acouphènes chroniques, surdité, accident",
        gravite: 16,
        frequence: 0,
        maitrise: 1,
        actionsExistantes: "Aucune exposition",
      },
    ],
  },
];
