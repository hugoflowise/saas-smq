import { describe, expect, it } from "vitest";
import {
  appliquerLibelles,
  clauseBadge,
  domaineLabel,
  objectifsLabel,
  politiqueLabel,
  systemeSigle,
} from "./normes-libelles";

describe("domaineLabel", () => {
  it("famille unique → libellé propre", () => {
    expect(domaineLabel(["9001"])).toBe("qualité");
    expect(domaineLabel(["MASE"])).toBe("SSE");
    expect(domaineLabel(["45001"])).toBe("SSE");
    expect(domaineLabel(["14001"])).toBe("environnement");
  });

  it("au moins deux familles → QSSE", () => {
    expect(domaineLabel(["9001", "MASE"])).toBe("QSSE");
    expect(domaineLabel(["9001", "14001"])).toBe("QSSE");
  });

  it("deux normes de la MÊME famille restent sur le libellé propre", () => {
    expect(domaineLabel(["45001", "MASE"])).toBe("SSE");
  });

  it("repli qualité si aucune norme", () => {
    expect(domaineLabel([])).toBe("qualité");
  });
});

describe("politique / objectifs / sigle", () => {
  it("compose selon le domaine", () => {
    expect(politiqueLabel(["9001"])).toBe("Politique qualité");
    expect(politiqueLabel(["MASE"])).toBe("Politique SSE");
    expect(politiqueLabel(["9001", "MASE"])).toBe("Politique QSSE");
    expect(objectifsLabel(["MASE"])).toBe("Objectifs SSE");
  });

  it("sigle du système", () => {
    expect(systemeSigle(["9001"])).toBe("SMQ");
    expect(systemeSigle(["MASE"])).toBe("SSE");
    expect(systemeSigle(["9001", "MASE"])).toBe("QSSE");
  });
});

describe("clauseBadge", () => {
  it("liste les chapitres des normes actives dans l'ordre NORMES", () => {
    expect(clauseBadge("politique", ["9001"])).toBe("ISO 9001 §5.2");
    expect(clauseBadge("politique", ["MASE"])).toBe("MASE §1.2");
    expect(clauseBadge("politique", ["MASE", "9001"])).toBe("ISO 9001 §5.2 · MASE §1.2");
  });

  it("ignore les normes sans chapitre pour le concept", () => {
    expect(clauseBadge("objectifs", ["9001", "CEFRI"])).toBe("ISO 9001 §6.2");
  });

  it("undefined si concept inconnu ou aucun chapitre", () => {
    expect(clauseBadge("inconnu", ["9001"])).toBeUndefined();
    expect(clauseBadge("politique", ["CEFRI"])).toBeUndefined();
  });
});

describe("appliquerLibelles", () => {
  it("substitue les jetons selon les normes", () => {
    expect(appliquerLibelles("votre {{sigle}}", ["9001"])).toBe("votre SMQ");
    expect(appliquerLibelles("votre {{sigle}}", ["MASE"])).toBe("votre SSE");
    expect(appliquerLibelles("espace {{domaine}}", ["9001", "MASE"])).toBe("espace QSSE");
  });

  it("{{Systeme}} met la première lettre en majuscule", () => {
    expect(appliquerLibelles("{{Systeme}}", ["MASE"])).toBe("Système de management SSE");
  });

  it("laisse le texte intact s'il n'y a pas de jeton", () => {
    expect(appliquerLibelles("Bonjour", ["9001"])).toBe("Bonjour");
  });
});
