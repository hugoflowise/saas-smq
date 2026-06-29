import { describe, expect, it } from "vitest";
import { etatEcheance } from "./competences";
import { dateOffsetISO } from "./format";

describe("etatEcheance", () => {
  it("renvoie « aucune » sans date d'échéance", () => {
    expect(etatEcheance(null)).toBe("aucune");
  });

  it("renvoie « expiree » pour une date passée", () => {
    expect(etatEcheance(dateOffsetISO(-1))).toBe("expiree");
  });

  it("renvoie « bientot » dans la fenêtre d'alerte (≤ 60 j)", () => {
    expect(etatEcheance(dateOffsetISO(30))).toBe("bientot");
  });

  it("renvoie « valide » au-delà de la fenêtre d'alerte", () => {
    expect(etatEcheance(dateOffsetISO(120))).toBe("valide");
  });
});
