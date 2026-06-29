import { describe, expect, it } from "vitest";
import { CRITERES_FOURNISSEUR, moyenneCriteres } from "./fournisseurs-criteres";

describe("moyenneCriteres", () => {
  it("renvoie null quand aucune note", () => {
    expect(moyenneCriteres({})).toBeNull();
  });

  it("ignore les valeurs nulles ou ≤ 0", () => {
    expect(moyenneCriteres({ qualite: 0, delai: 4 })).toBe(4);
  });

  it("arrondit la moyenne à l'entier (échelle 1-5)", () => {
    // (4 + 5 + 3) / 3 = 4
    expect(moyenneCriteres({ qualite: 4, delai: 5, prix: 3 })).toBe(4);
    // (5 + 4) / 2 = 4.5 → 5
    expect(moyenneCriteres({ qualite: 5, delai: 4 })).toBe(5);
  });
});

describe("CRITERES_FOURNISSEUR", () => {
  it("expose une grille de 5 critères à clés uniques", () => {
    const cles = CRITERES_FOURNISSEUR.map((c) => c.cle);
    expect(cles).toHaveLength(5);
    expect(new Set(cles).size).toBe(5);
  });
});
