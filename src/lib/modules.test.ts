import { describe, expect, it } from "vitest";
import { isModuleVisible, normalizeNormes } from "./modules";

describe("normalizeNormes", () => {
  it("conserve les codes de normes valides", () => {
    expect(normalizeNormes(["9001", "MASE"])).toEqual(["9001", "MASE"]);
  });

  it("filtre les codes inconnus", () => {
    expect(normalizeNormes(["9001", "bidon", "45001"])).toEqual(["9001", "45001"]);
  });

  it("renvoie un tableau vide pour une entrée vide", () => {
    expect(normalizeNormes([])).toEqual([]);
  });
});

describe("isModuleVisible", () => {
  it("un module socle est toujours visible, même sans norme active", () => {
    expect(isModuleVisible("/dashboard", [])).toBe(true);
    expect(isModuleVisible("/corbeille", ["MASE"])).toBe(true);
  });

  it("un href non listé (tronc commun) est visible dès qu'une norme est active", () => {
    expect(isModuleVisible("/strategie/politique", ["MASE"])).toBe(true);
    expect(isModuleVisible("/audits", ["9001"])).toBe(true);
  });

  it("un href non listé n'est pas visible sans aucune norme active", () => {
    expect(isModuleVisible("/strategie/politique", [])).toBe(false);
  });

  it("un module métier 9001 est masqué pour un client MASE seul", () => {
    expect(isModuleVisible("/suivi-prestation", ["MASE"])).toBe(false);
    expect(isModuleVisible("/fournisseurs", ["MASE"])).toBe(false);
  });

  it("un module métier 9001 reste visible pour un client 9001 (même multi-normes)", () => {
    expect(isModuleVisible("/suivi-prestation", ["9001"])).toBe(true);
    expect(isModuleVisible("/fournisseurs", ["9001", "MASE"])).toBe(true);
  });

  it("les modules du tronc ISO Annexe SL sont masqués pour un client MASE seul", () => {
    for (const href of [
      "/strategie/contexte",
      "/strategie/domaine",
      "/strategie/parties-prenantes",
      "/risques",
      "/modifications-smq",
      "/processus",
      "/nc",
    ]) {
      expect(isModuleVisible(href, ["MASE"])).toBe(false);
    }
  });

  it("les modules du tronc ISO Annexe SL restent visibles pour une norme ISO", () => {
    expect(isModuleVisible("/processus", ["9001"])).toBe(true);
    expect(isModuleVisible("/risques", ["45001"])).toBe(true);
    expect(isModuleVisible("/strategie/contexte", ["14001", "MASE"])).toBe(true);
  });

  it("le management commun reste visible pour MASE (politique, objectifs, audits, veille, remontées, revue, auto-diag)", () => {
    for (const href of [
      "/strategie/politique",
      "/strategie/objectifs",
      "/audits",
      "/veille",
      "/reclamations",
      "/revues/direction",
      "/conformite",
    ]) {
      expect(isModuleVisible(href, ["MASE"])).toBe(true);
    }
  });
});
