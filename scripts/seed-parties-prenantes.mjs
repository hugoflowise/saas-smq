// Seed des parties prenantes (registre Léa / Fortil) pour un tenant donné.
// Usage : node scripts/seed-parties-prenantes.mjs <tenant_id>
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const TENANT = process.argv[2];
if (!TENANT) {
  console.error("tenant_id requis en argument");
  process.exit(1);
}

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// m = maîtrise : 'maitrise' (0,25) | 'partiel' (0,5) | 'non_maitrise' (1)
const PARTIES = [
  {
    nom: "Dirigeants & associés",
    sphere: "interne",
    type: "actionnaire",
    interaction: "forte",
    pouvoir: 3,
    legitimite: 3,
    urgence: 3,
    attentes: [
      {
        attente: "Bonne image de marque",
        risque: "Perte de CA, baisse de l'attractivité candidat",
        m: "maitrise",
      },
      {
        attente: "Augmentation du CA, part de marché, rentabilité",
        risque: "Réduction de l'effectif",
        m: "maitrise",
      },
      { attente: "Rentabilité sur investissement", risque: "Perte de CA", m: "maitrise" },
      { attente: "Fidéliser les clients", risque: "Perte de CA, turnover", m: "maitrise" },
      {
        attente: "Augmentation des effectifs",
        risque: "Ingérence, conflits, démission, disparition du sens",
        m: "partiel",
      },
      {
        attente: "Citoyenneté (solidarité avec les associations régionales)",
        risque: "Impact sur l'image de l'entreprise",
        m: "maitrise",
      },
      {
        attente: "Développer l'activité avec des engagements environnementaux forts",
        risque: "Impact sur l'image de l'entreprise. Baisse de l'attractivité candidat et clients",
        opportunite:
          "Préservation de l'environnement avec la réduction des impacts environnementaux. Fidélisation des clients et des candidats. Gain de transparence sur les activités",
        m: "partiel",
      },
      {
        attente: "Répondre aux exigences réglementaires",
        risque: "Mise en demeure jusqu'à arrêt des activités",
        opportunite:
          "Développer un système de veille réglementaire performant. Conserver la conformité de nos activités",
        m: "maitrise",
      },
      {
        attente: "Réduire sa dépendance à l'usage des ressources naturelles",
        risque: "Arrêt de certaines activités sur le long terme",
        opportunite: "Assurer la résilience de la société. Adaptation aux changements climatiques",
        m: "non_maitrise",
      },
      {
        attente: "Implication des salariés dans le respect et le déploiement du SME",
        risque: "Non atteinte des objectifs fixés. Non réduction des impacts environnementaux",
        opportunite: "Assurer l'efficacité du SME. Atteinte des objectifs de réduction des impacts",
        m: "partiel",
      },
      {
        attente:
          "Assurer que prestataires et fournisseurs répondent aux engagements environnementaux",
        risque: "Mauvaise image. Augmentation des impacts environnementaux",
        opportunite:
          "Atteinte des objectifs environnementaux. Réduction des impacts. Bonne image. Influence positive sur nos prestataires et fournisseurs",
        m: "non_maitrise",
      },
    ],
  },
  {
    nom: "Collaborateurs",
    sphere: "interne",
    type: "collaborateur",
    interaction: "forte",
    pouvoir: 2,
    legitimite: 3,
    urgence: 3,
    attentes: [
      { attente: "Intégration dans l'entreprise", risque: "Démission", m: "partiel" },
      { attente: "Épanouissement, motivation, reconnaissance", risque: "Démission", m: "partiel" },
      {
        attente: "Expertise, formations, évaluation",
        risque: "Perte de sens, démission, image du client",
        m: "partiel",
      },
      {
        attente: "Bonnes conditions de travail (SST et bien-être)",
        risque: "Démission, TMS, RPS",
        m: "maitrise",
      },
      {
        attente: "Implication dans le système de management environnemental",
        risque:
          "Non respect du SME. Perte de la dynamique environnementale. Non atteinte des objectifs",
        opportunite:
          "Bon respect des consignes. Application du SME. Maîtrise des impacts environnementaux",
        m: "partiel",
      },
      {
        attente: "Répondre aux convictions et valeurs personnelles",
        risque: "Manque d'intégration, pas de partage de valeurs pouvant conduire à la démission",
        opportunite: "Amélioration des conditions de travail (bien-être)",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Candidat",
    sphere: "externe",
    type: "autre",
    interaction: "forte",
    pouvoir: 1,
    legitimite: 2,
    urgence: 2,
    attentes: [
      {
        attente: "Recrutement",
        risque: "Perte d'attractivité. Mauvais ciblage des collaborateurs",
        m: "maitrise",
      },
      {
        attente: "Reconnaissance des aptitudes à intégrer des projets",
        risque: "Mauvaise intégration",
        m: "maitrise",
      },
      {
        attente: "Suivi des entretiens",
        risque: "Passer à côté d'un bon candidat. Mauvaise image de l'entreprise",
        m: "maitrise",
      },
      {
        attente: "Comprendre l'entreprise, son fonctionnement et ses offres",
        risque: "Mauvaise intégration. Mauvais ciblage de l'offre",
        m: "maitrise",
      },
      {
        attente: "Transparence sur les engagements environnementaux",
        risque: "Manque d'attractivité. Manque de partage des valeurs du candidat",
        opportunite:
          "Attractivité de la société. Recrutement d'un candidat sensible aux enjeux environnementaux. Bonne intégration / partage des valeurs",
        m: "partiel",
      },
    ],
  },
  {
    nom: "État / Collectivités territoriales",
    sphere: "externe",
    type: "autorite",
    interaction: "moyenne",
    pouvoir: 2,
    legitimite: 2,
    urgence: 3,
    attentes: [
      {
        attente: "Respect des exigences légales et réglementaires applicables",
        risque: "Responsabilité pénale et civile engagées",
        m: "maitrise",
      },
      { attente: "Versement de taxes et impôts", risque: "Fraude fiscale", m: "maitrise" },
      {
        attente: "Engagements environnementaux",
        risque:
          "Mauvaise image des activités. Freiner les activités dont la maîtrise des risques n'est pas suffisante",
        opportunite: "Bonne image de la société (conscience et engagements environnementaux)",
        m: "partiel",
      },
      { attente: "Engagement sociétal", risque: "Mauvaise image de l'entreprise", m: "maitrise" },
    ],
  },
  {
    nom: "Clients",
    sphere: "externe",
    type: "client",
    interaction: "forte",
    pouvoir: 2,
    legitimite: 2,
    urgence: 3,
    attentes: [
      {
        attente: "Conformité aux exigences des prestations / projets",
        risque: "Baisse de la satisfaction client. Perte de rentabilité. Mauvaise image de marque",
        m: "maitrise",
      },
      {
        attente: "Qualité de service (prix, respect des délais)",
        risque: "Mauvaise image de marque. Baisse des performances",
        m: "partiel",
      },
      {
        attente: "Interventions dans le respect des consignes environnementales internes",
        risque:
          "Mauvaise image des ingénieurs influençant l'opinion du client. Impacts environnementaux",
        opportunite: "Image de qualité des ingénieurs. Maîtrise des impacts environnementaux",
        m: "partiel",
      },
      {
        attente: "Capacité des ingénieurs à maîtriser leurs impacts environnementaux",
        risque: "Altération de l'environnement. Perte d'opportunités",
        opportunite:
          "Image de qualité des ingénieurs. Fidélisation des clients. Réduction des impacts",
        m: "partiel",
      },
      {
        attente: "Sécurité de la propriété client",
        risque: "Mauvaise image de marque. Responsabilité civile et pénale. Fuite des données",
        m: "maitrise",
      },
    ],
  },
  {
    nom: "Prospects",
    sphere: "externe",
    type: "client",
    interaction: "forte",
    pouvoir: 2,
    legitimite: 2,
    urgence: 2,
    attentes: [
      {
        attente: "Créativité et innovation dans les offres",
        risque: "Baisse d'attractivité clients. Perte du prospect",
        m: "partiel",
      },
      {
        attente: "Certifications ou labels de qualité attestant les engagements",
        risque: "Baisse de l'attractivité. Perte du prospect",
        opportunite: "Attractivité",
        m: "maitrise",
      },
      {
        attente: "Offres avantageuses par rapport à la concurrence",
        risque: "Baisse d'attractivité. Perte du prospect",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Prestataires externes",
    sphere: "externe",
    type: "fournisseur",
    interaction: "forte",
    pouvoir: 2,
    legitimite: 1,
    urgence: 2,
    attentes: [
      {
        attente: "Paiement à temps",
        risque: "Mauvaise image de l'entreprise. Perte du prestataire",
        m: "maitrise",
      },
      {
        attente: "Continuité de la collaboration",
        risque: "Mauvaise image de l'entreprise. Perte du prestataire",
        m: "maitrise",
      },
    ],
  },
  {
    nom: "Institutions financières",
    sphere: "externe",
    type: "autre",
    interaction: "moyenne",
    pouvoir: 3,
    legitimite: 3,
    urgence: 3,
    attentes: [
      {
        attente: "Remboursement des emprunts et paiement des intérêts",
        risque: "Compte gelé, mauvaise image de l'entreprise",
        m: "maitrise",
      },
    ],
  },
  {
    nom: "Associations",
    sphere: "externe",
    type: "autre",
    interaction: "faible",
    pouvoir: 2,
    legitimite: 1,
    urgence: 2,
    attentes: [
      {
        attente: "Soutiens financiers et participation aux activités des associations",
        risque: "Mauvaise image de l'entreprise",
        m: "maitrise",
      },
      {
        attente: "Respect du milieu environnant aux activités (associations naturalistes)",
        risque: "Mauvaise image. Possibles conflits d'intérêt",
        opportunite: "Bonne image de la société (conscience et engagements environnementaux)",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Concurrence",
    sphere: "externe",
    type: "autre",
    interaction: "faible",
    pouvoir: 1,
    legitimite: 1,
    urgence: 1,
    attentes: [
      {
        attente: "Concurrence loyale, possibilité de coopération",
        risque: "Mauvaise publicité",
        m: "maitrise",
      },
    ],
  },
  {
    nom: "Médias",
    sphere: "externe",
    type: "autre",
    interaction: "moyenne",
    pouvoir: 2,
    legitimite: 2,
    urgence: 2,
    attentes: [
      {
        attente: "Respect des engagements envers la société. Transparence financière",
        risque: "Mauvaise publicité. Baisse de la notoriété de la société",
        m: "partiel",
      },
      {
        attente: "Transparence sur les engagements environnementaux",
        risque: "Mauvaise publicité. Baisse de la notoriété",
        opportunite: "Bonne image de la société (conscience et engagements environnementaux)",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Fournisseurs / sous-traitants",
    sphere: "externe",
    type: "fournisseur",
    interaction: "faible",
    pouvoir: 2,
    legitimite: 1,
    urgence: 2,
    attentes: [
      {
        attente:
          "Paiement à temps, volume des ventes, solvabilité, sécurité, transparence, respect des procédures et exigences",
        risque: "Mauvaise image de l'entreprise, dettes, baisse de satisfaction",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Acquisitions (rachats d'entreprises par le groupe)",
    sphere: "externe",
    type: "autre",
    interaction: "elevee",
    pouvoir: 2,
    legitimite: 2,
    urgence: 2,
    attentes: [
      {
        attente:
          "Intégration à la société. Bonne image de marque. Augmentation du CA et part de marché. Rentabilité / performance",
        risque: "Baisse du CA. Perte de rentabilité. Mauvaise image de l'entreprise",
        m: "partiel",
      },
      {
        attente: "Partage des valeurs et des engagements environnementaux",
        risque: "Mauvaise image de l'entreprise. Perte du rachat de la nouvelle entreprise",
        opportunite:
          "Bonne image de la société. Intégration d'une nouvelle filiale. Croissance de l'activité",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Partenaires",
    sphere: "externe",
    type: "autre",
    interaction: "moyenne",
    pouvoir: 1,
    legitimite: 1,
    urgence: 2,
    attentes: [
      {
        attente: "Soutien financier, promotion",
        risque: "Mauvaise image de l'entreprise",
        m: "partiel",
      },
    ],
  },
  {
    nom: "Autorité de contrôle",
    sphere: "externe",
    type: "autorite",
    interaction: "elevee",
    pouvoir: 3,
    legitimite: 2,
    urgence: 3,
    attentes: [
      {
        attente: "Respect des exigences légales et réglementaires applicables",
        risque:
          "Perte de la certification / qualification. Mise en demeure jusqu'à arrêt des activités",
        opportunite:
          "Développer un système de veille réglementaire performant. Conserver la conformité de nos activités",
        m: "maitrise",
      },
    ],
  },
];

let parties = 0;
let attentes = 0;
for (const p of PARTIES) {
  const { data: partie, error } = await supa
    .from("parties_interessees")
    .insert({
      tenant_id: TENANT,
      nom: p.nom,
      sphere: p.sphere,
      type: p.type,
      niveau_interaction: p.interaction,
      pouvoir: p.pouvoir,
      legitimite: p.legitimite,
      urgence: p.urgence,
    })
    .select("id")
    .single();
  if (error) {
    console.error(`Partie "${p.nom}" :`, error.message);
    continue;
  }
  parties++;
  const rows = p.attentes.map((a, i) => ({
    tenant_id: TENANT,
    partie_id: partie.id,
    attente: a.attente,
    risque: a.risque ?? null,
    opportunite: a.opportunite ?? null,
    maitrise: a.m,
    ordre: i,
  }));
  const { error: aErr } = await supa.from("pi_attentes").insert(rows);
  if (aErr) console.error(`Attentes "${p.nom}" :`, aErr.message);
  else attentes += rows.length;
}

console.log(
  `✓ ${parties} parties prenantes, ${attentes} attentes insérées pour le tenant ${TENANT}.`,
);
