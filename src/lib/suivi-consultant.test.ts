import { describe, expect, it } from "vitest";
import {
  ALERTE_KEYS,
  QSSE_CONFORMITE_KEYS,
  SUIVI_CONSULTANT_CHAMPS,
  SUIVI_CONSULTANT_SECTIONS,
} from "./suivi-consultant";

const keys = new Set(SUIVI_CONSULTANT_CHAMPS.map((c) => c.key));

describe("config Suivi consultant", () => {
  it("expose des clés de champ uniques", () => {
    expect(keys.size).toBe(SUIVI_CONSULTANT_CHAMPS.length);
  });

  it("chaque condition showIf référence un champ existant", () => {
    for (const c of SUIVI_CONSULTANT_CHAMPS) {
      if (c.showIf) expect(keys.has(c.showIf.key)).toBe(true);
    }
  });

  it("les champs à choix (single/multi) ont des options", () => {
    for (const c of SUIVI_CONSULTANT_CHAMPS) {
      if (c.type === "single" || c.type === "multi") {
        expect((c.options ?? []).length).toBeGreaterThan(0);
      }
    }
  });

  it("les clés QSSE et alertes référencent des champs existants", () => {
    for (const k of [...QSSE_CONFORMITE_KEYS, ...ALERTE_KEYS]) {
      expect(keys.has(k)).toBe(true);
    }
  });

  it("numérote les sections de 1 à 10", () => {
    expect(SUIVI_CONSULTANT_SECTIONS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("expose les champs KPI numériques requis", () => {
    for (const k of ["satisfaction_globale", "note_qualite_suivi_manager", "nps"]) {
      const champ = SUIVI_CONSULTANT_CHAMPS.find((c) => c.key === k);
      expect(champ?.required).toBe(true);
      expect(["note5", "nps"]).toContain(champ?.type);
    }
  });
});
