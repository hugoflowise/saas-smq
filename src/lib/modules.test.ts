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
});
