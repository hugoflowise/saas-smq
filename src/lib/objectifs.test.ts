import { describe, expect, it } from "vitest";
import { objectifProgress } from "./objectifs";

describe("objectifProgress", () => {
  it("renvoie null si la valeur ou la cible manque", () => {
    expect(objectifProgress(null, 100, "hausse")).toBeNull();
    expect(objectifProgress(50, null, "hausse")).toBeNull();
  });

  describe("sens hausse (atteindre la cible)", () => {
    it("calcule le pourcentage atteint", () => {
      expect(objectifProgress(45, 90, "hausse")).toBe(50);
      expect(objectifProgress(90, 90, "hausse")).toBe(100);
    });
    it("plafonne à 100 si la cible est dépassée", () => {
      expect(objectifProgress(120, 90, "hausse")).toBe(100);
    });
    it("cible 0 => 100 si valeur >= 0", () => {
      expect(objectifProgress(0, 0, "hausse")).toBe(100);
    });
    it("traite l'absence de sens comme une hausse", () => {
      expect(objectifProgress(45, 90, null)).toBe(50);
    });
  });

  describe("sens baisse (ne pas dépasser)", () => {
    it("100 % si on est sous la cible", () => {
      expect(objectifProgress(3, 5, "baisse")).toBe(100);
      expect(objectifProgress(5, 5, "baisse")).toBe(100);
    });
    it("dégrade le score quand on dépasse la cible", () => {
      // cible 5, actuelle 10 => 5/10 = 50 %
      expect(objectifProgress(10, 5, "baisse")).toBe(50);
    });
  });

  it("borne toujours entre 0 et 100", () => {
    const v = objectifProgress(1000, 1, "hausse");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});
