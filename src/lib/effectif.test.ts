import { describe, expect, it } from "vitest";
import { type Consultant, computeEffectif, nomComplet } from "./effectif";

function c(over: Partial<Consultant>): Consultant {
  return {
    id: Math.random().toString(),
    reference: null,
    nom: "X",
    prenom: null,
    entite: null,
    poste: null,
    date_demarrage: null,
    date_fin: null,
    odm: false,
    pdp: false,
    visite_medicale: false,
    ...over,
  };
}

const TODAY = "2026-06-19";

describe("computeEffectif", () => {
  const consultants = [
    c({ date_demarrage: "2026-01-01", date_fin: null, odm: true, visite_medicale: true }), // A actif
    c({ date_demarrage: "2026-06-10", date_fin: "2026-12-01", odm: true, pdp: true }), // B actif (entrée)
    c({ date_demarrage: "2026-07-01" }), // C futur arrivant
    c({ date_demarrage: "2025-01-01", date_fin: "2026-05-01" }), // D sorti
    c({ date_demarrage: "2026-01-01", date_fin: "2026-09-01" }), // E actif (futur sortant)
  ];
  const r = computeEffectif(consultants, TODAY);

  it("compte les consultants présents à la date du jour", () => {
    expect(r.effectifActuel).toBe(3); // A, B, E
  });

  it("calcule les taux de couverture sur les actifs", () => {
    expect(r.couverture.odm).toBe(67); // A, B sur 3
    expect(r.couverture.pdp).toBe(33); // B sur 3
    expect(r.couverture.visite).toBe(33); // A sur 3
  });

  it("produit une tendance sur 12 semaines", () => {
    expect(r.trend).toHaveLength(12);
    expect(r.trend.at(-1)?.valeur).toBe(3);
  });

  it("classe les mouvements (entrées, sorties, futurs)", () => {
    expect(r.mouvements.entrees).toHaveLength(1);
    expect(r.mouvements.sorties).toHaveLength(1);
    expect(r.mouvements.futursArrivants).toHaveLength(1);
    expect(r.mouvements.futursSortants).toHaveLength(2); // B, E
  });

  it("renvoie une couverture nulle sans effectif", () => {
    const vide = computeEffectif([], TODAY);
    expect(vide.effectifActuel).toBe(0);
    expect(vide.couverture.odm).toBeNull();
  });
});

describe("nomComplet", () => {
  it("concatène prénom et nom", () => {
    expect(nomComplet({ prenom: "Marie", nom: "Durand" })).toBe("Marie Durand");
    expect(nomComplet({ prenom: null, nom: "Durand" })).toBe("Durand");
  });
});
