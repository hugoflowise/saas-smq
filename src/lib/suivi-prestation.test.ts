import { describe, expect, it } from "vitest";
import { SATISFACTION_AXES, SUIVI_PRESTATION_SECTIONS } from "./suivi-prestation";

const champs = SUIVI_PRESTATION_SECTIONS.flatMap((s) => s.champs);
const keys = new Set(champs.map((c) => c.key));

describe("config Suivi de prestation", () => {
  it("expose des clés de champ uniques", () => {
    expect(keys.size).toBe(champs.length);
  });

  it("chaque condition showIf référence un champ existant", () => {
    for (const c of champs) {
      if (c.showIf) expect(keys.has(c.showIf.key)).toBe(true);
    }
  });

  it("les champs à choix (single/multi) ont des options", () => {
    for (const c of champs) {
      if (c.type === "single" || c.type === "multi") {
        expect((c.options ?? []).length).toBeGreaterThan(0);
      }
    }
  });

  it("numérote les sections de 1 à 9", () => {
    expect(SUIVI_PRESTATION_SECTIONS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("expose les colonnes dénormalisées comme champs socle verrouillés", () => {
    for (const k of [
      "consultant",
      "client",
      "mission",
      "manager",
      "date_suivi",
      "satisfaction_globale",
      "nps",
      "nouvelle_date_suivi",
    ]) {
      const champ = champs.find((c) => c.key === k);
      expect(champ?.verrou).toBe(true);
    }
  });

  it("expose les KPI satisfaction/nps avec le bon rôle et type", () => {
    const satisfaction = champs.find((c) => c.key === "satisfaction_globale");
    expect(satisfaction?.type).toBe("note5");
    expect(satisfaction?.roleStat).toBe("satisfaction");
    const nps = champs.find((c) => c.key === "nps");
    expect(nps?.type).toBe("nps");
    expect(nps?.roleStat).toBe("nps");
  });

  it("expose la matrice de satisfaction avec ses 6 axes et son échelle 1→4", () => {
    const matrice = champs.find((c) => c.key === "satisfaction_axes");
    expect(matrice?.type).toBe("matrice");
    expect(matrice?.required).toBe(true);
    expect(matrice?.lignes).toEqual(SATISFACTION_AXES);
    expect(matrice?.echelle?.min).toBe(1);
    expect(matrice?.echelle?.max).toBe(4);
  });
});
