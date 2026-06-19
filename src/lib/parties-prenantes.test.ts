import { describe, expect, it } from "vitest";
import { criticiteResiduelle, prioriteFromTotal, scoreTotal } from "./parties-prenantes";

describe("scoreTotal", () => {
  it("reproduit les totaux du registre Fortil", () => {
    expect(scoreTotal(3, 3, 3)).toBe(5.25); // Dirigeants
    expect(scoreTotal(2, 3, 3)).toBe(4.25); // Collaborateurs
    expect(scoreTotal(1, 2, 2)).toBe(2.5); // Candidat
    expect(scoreTotal(1, 1, 1)).toBe(1.75); // minimum
  });
});

describe("prioriteFromTotal", () => {
  it("classe selon les seuils observés", () => {
    expect(prioriteFromTotal(5.25)).toBe(3);
    expect(prioriteFromTotal(4)).toBe(3);
    expect(prioriteFromTotal(3.75)).toBe(2);
    expect(prioriteFromTotal(2.5)).toBe(2);
    expect(prioriteFromTotal(2)).toBe(1);
    expect(prioriteFromTotal(1.75)).toBe(1);
  });
});

describe("criticiteResiduelle", () => {
  it("= priorité × coefficient de maîtrise", () => {
    expect(criticiteResiduelle(3, "maitrise")).toBe(0.75); // 3 × 0,25
    expect(criticiteResiduelle(3, "partiel")).toBe(1.5); // 3 × 0,5
    expect(criticiteResiduelle(3, "non_maitrise")).toBe(3); // 3 × 1
    expect(criticiteResiduelle(2, "maitrise")).toBe(0.5);
    expect(criticiteResiduelle(1, "non_maitrise")).toBe(1);
  });
});
