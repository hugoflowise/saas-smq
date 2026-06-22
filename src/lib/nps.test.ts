import { describe, expect, it } from "vitest";
import { computeNps, npsLabel, trimestre } from "./nps";

describe("computeNps", () => {
  it("renvoie null pour une liste vide ou uniquement nulle", () => {
    expect(computeNps([])).toEqual({ nps: null, count: 0 });
    expect(computeNps([null, null])).toEqual({ nps: null, count: 0 });
  });

  it("ignore les valeurs nulles dans le décompte", () => {
    expect(computeNps([10, null, 9])).toEqual({ nps: 100, count: 2 });
  });

  it("classe correctement promoteurs (9-10), neutres (7-8), détracteurs (0-6)", () => {
    // 1 promoteur, 1 neutre, 1 détracteur => (1-1)/3 = 0
    expect(computeNps([9, 8, 6]).nps).toBe(0);
  });

  it("une seule note de 8 (neutre) donne un NPS de 0", () => {
    expect(computeNps([8])).toEqual({ nps: 0, count: 1 });
  });

  it("100 % promoteurs => 100, 100 % détracteurs => -100", () => {
    expect(computeNps([9, 10]).nps).toBe(100);
    expect(computeNps([0, 6, 3]).nps).toBe(-100);
  });

  it("arrondit le résultat", () => {
    // 2 promoteurs, 1 détracteur sur 3 => (2-1)/3*100 = 33.33 -> 33
    expect(computeNps([9, 10, 0]).nps).toBe(33);
  });
});

describe("npsLabel", () => {
  it("mappe les seuils", () => {
    expect(npsLabel(null)).toBe("-");
    expect(npsLabel(70)).toBe("Excellent");
    expect(npsLabel(30)).toBe("Bon");
    expect(npsLabel(0)).toBe("À améliorer");
    expect(npsLabel(-1)).toBe("Insuffisant");
  });
});

describe("trimestre", () => {
  it("calcule le trimestre depuis une date ISO", () => {
    expect(trimestre("2026-01-15")).toBe("2026-T1");
    expect(trimestre("2026-03-31")).toBe("2026-T1");
    expect(trimestre("2026-04-01")).toBe("2026-T2");
    expect(trimestre("2026-12-31")).toBe("2026-T4");
  });
});
