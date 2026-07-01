import { describe, expect, it } from "vitest";
import {
  analyserSuivisPrestation,
  anneesDisponibles,
  type SuiviPrestationRow,
  syntheseEcouteClient,
} from "./suivi-prestation-analyse";

/** Fabrique une ligne de suivi avec des valeurs par défaut neutres. */
function suivi(partial: Partial<SuiviPrestationRow> = {}): SuiviPrestationRow {
  return {
    consultant: null,
    client: null,
    mission: null,
    date_suivi: null,
    satisfaction_globale: null,
    nps: null,
    est_reclamation: false,
    reponses: null,
    ...partial,
  };
}

describe("analyserSuivisPrestation", () => {
  it("renvoie des valeurs vides sans planter sur une liste vide", () => {
    const a = analyserSuivisPrestation([]);
    expect(a.nbSuivis).toBe(0);
    expect(a.satMoyenne).toBeNull();
    expect(a.satPct).toBeNull();
    expect(a.nps).toBeNull();
    expect(a.conformiteQsse).toBeNull();
    expect(a.axes.every((x) => x.pct === null)).toBe(true);
    expect(a.vigilance).toEqual([]);
    expect(a.verbatims).toEqual([]);
  });

  it("compte clients et consultants distincts (insensible à la casse/espaces)", () => {
    const a = analyserSuivisPrestation([
      suivi({ client: "Acme", consultant: "Jean Dupont" }),
      suivi({ client: " acme ", consultant: "Marie Martin" }),
      suivi({ client: "Beta", consultant: "jean dupont" }),
    ]);
    expect(a.nbSuivis).toBe(3);
    expect(a.nbClients).toBe(2);
    expect(a.nbConsultants).toBe(2);
  });

  it("calcule la satisfaction moyenne /5 et le % de satisfaits (>= 4)", () => {
    const a = analyserSuivisPrestation([
      suivi({ satisfaction_globale: 5 }),
      suivi({ satisfaction_globale: 4 }),
      suivi({ satisfaction_globale: 2 }),
      suivi({ satisfaction_globale: null }),
    ]);
    expect(a.satMoyenne).toBeCloseTo(3.7, 5); // (5+4+2)/3 = 3.666..
    expect(a.satPct).toBe(67); // 2 sur 3 >= 4
  });

  it("répartit le NPS en promoteurs / passifs / détracteurs", () => {
    const a = analyserSuivisPrestation([
      suivi({ nps: 10 }),
      suivi({ nps: 9 }),
      suivi({ nps: 8 }),
      suivi({ nps: 6 }),
      suivi({ nps: null }),
    ]);
    expect(a.npsRepartition.total).toBe(4);
    expect(a.npsRepartition.promoteurs).toBe(2);
    expect(a.npsRepartition.passifs).toBe(1);
    expect(a.npsRepartition.detracteurs).toBe(1);
    expect(a.nps).toBe(25); // (2-1)/4 = 25 %
    expect(a.npsRepartition.pctPromoteurs).toBe(50);
  });

  it("agrège les axes de satisfaction (matrice 1-4, top box >= 3)", () => {
    const a = analyserSuivisPrestation([
      suivi({ reponses: { satisfaction_axes: { qualite_travail: 4, implication: 2 } } }),
      suivi({ reponses: { satisfaction_axes: { qualite_travail: 3, implication: 1 } } }),
    ]);
    const qualite = a.axes.find((x) => x.key === "qualite_travail");
    const implication = a.axes.find((x) => x.key === "implication");
    expect(qualite?.count).toBe(2);
    expect(qualite?.moyenne).toBeCloseTo(3.5, 5);
    expect(qualite?.pct).toBe(100); // 4 et 3 sont tous >= 3
    expect(qualite?.pctInsatisfait).toBe(0);
    expect(implication?.pct).toBe(0); // 2 et 1 sont < 3
    expect(implication?.pctInsatisfait).toBe(100);
  });

  it("tolère des notes d'axe en chaîne et ignore les valeurs hors bornes", () => {
    const a = analyserSuivisPrestation([
      suivi({ reponses: { satisfaction_axes: { qualite_travail: "4" } } }),
      suivi({ reponses: { satisfaction_axes: { qualite_travail: 9 } } }),
    ]);
    const qualite = a.axes.find((x) => x.key === "qualite_travail");
    expect(qualite?.count).toBe(1);
    expect(qualite?.pct).toBe(100);
  });

  it("calcule la conformité QSSE en ignorant les « Sans objet »", () => {
    const a = analyserSuivisPrestation([
      suivi({
        reponses: { securite_consignes: "Oui", securite_epi: "Oui", plan_prevention: "Non" },
      }),
      suivi({
        reponses: {
          securite_consignes: "Oui",
          securite_epi: "Sans objet",
          plan_prevention: "Oui",
        },
      }),
    ]);
    // Oui = 4, Non = 1, Sans objet ignoré => 4/5 = 80 %
    expect(a.conformiteQsse).toBe(80);
  });

  it("compte les besoins détectés en excluant « aucun besoin »", () => {
    const a = analyserSuivisPrestation([
      suivi({ reponses: { besoins_futurs: ["Aucun besoin identifié pour l'instant"] } }),
      suivi({ reponses: { besoins_futurs: ["Prolongation de la mission en cours"] } }),
      suivi({
        reponses: {
          besoins_futurs: ["Besoin de formation", "Nouveau besoin / autre poste à pourvoir"],
        },
      }),
    ]);
    expect(a.nbBesoinsDetectes).toBe(2);
    expect(a.besoins).toContainEqual({ label: "Besoin de formation", count: 1 });
    expect(a.besoins.some((b) => b.label.includes("Aucun besoin"))).toBe(false);
  });

  it("remonte les points de vigilance (réclamation, satisfaction basse, détracteur)", () => {
    const a = analyserSuivisPrestation([
      suivi({ client: "Acme", est_reclamation: true, satisfaction_globale: 5, nps: 10 }),
      suivi({ client: "Beta", satisfaction_globale: 2, nps: 8 }),
      suivi({ client: "Gamma", satisfaction_globale: 4, nps: 3 }),
      suivi({ client: "Delta", satisfaction_globale: 5, nps: 10 }),
    ]);
    expect(a.vigilance).toHaveLength(3);
    const acme = a.vigilance.find((v) => v.client === "Acme");
    expect(acme?.motif).toBe("Réclamation");
    const gamma = a.vigilance.find((v) => v.client === "Gamma");
    expect(gamma?.motif).toContain("détracteur");
  });

  it("collecte et trie les verbatims du plus récent au plus ancien", () => {
    const a = analyserSuivisPrestation([
      suivi({
        client: "Acme",
        date_suivi: "2026-01-10",
        reponses: { commentaire_satisfaction: "  Très pro  ", commentaire_bilan: "" },
      }),
      suivi({
        client: "Beta",
        date_suivi: "2026-03-01",
        reponses: { amelioration_prestations: "Plus de reporting" },
      }),
    ]);
    expect(a.verbatims).toHaveLength(2);
    expect(a.verbatims[0]?.client).toBe("Beta"); // plus récent d'abord
    expect(a.verbatims[1]?.texte).toBe("Très pro"); // trimé
    expect(a.verbatims[1]?.origine).toBe("Satisfaction");
  });
});

describe("syntheseEcouteClient", () => {
  it("signale l'absence de suivi", () => {
    const a = analyserSuivisPrestation([]);
    expect(syntheseEcouteClient(a, "2026")).toContain("aucun suivi");
  });

  it("produit une synthèse texte lisible avec les indicateurs clés", () => {
    const a = analyserSuivisPrestation([
      suivi({
        client: "Acme",
        consultant: "Jean",
        date_suivi: "2026-02-01",
        satisfaction_globale: 5,
        nps: 10,
        reponses: { besoins_futurs: ["Besoin de formation"], securite_consignes: "Oui" },
      }),
    ]);
    const t = syntheseEcouteClient(a, "2026");
    expect(t).toContain("Écoute client");
    expect(t).toContain("NPS 100");
    expect(t).toContain("100% de clients satisfaits");
    expect(t.split("\n").length).toBeGreaterThan(3);
  });
});

describe("anneesDisponibles", () => {
  it("liste les années distinctes en ordre décroissant", () => {
    const annees = anneesDisponibles([
      suivi({ date_suivi: "2025-06-01" }),
      suivi({ date_suivi: "2026-01-15" }),
      suivi({ date_suivi: "2025-12-31" }),
      suivi({ date_suivi: null }),
    ]);
    expect(annees).toEqual([2026, 2025]);
  });
});
