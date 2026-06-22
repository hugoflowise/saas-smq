import { describe, expect, it } from "vitest";
import { dateLimiteReevaluation, estAReevaluer } from "./conformite";

describe("dateLimiteReevaluation", () => {
  it("recule de 12 mois par défaut", () => {
    expect(dateLimiteReevaluation("2026-06-22")).toBe("2025-06-22");
  });
  it("accepte un délai personnalisé", () => {
    expect(dateLimiteReevaluation("2026-06-22", 6)).toBe("2025-12-22");
  });
});

describe("estAReevaluer", () => {
  const limite = "2025-06-22";

  it("signale une cotation conforme trop ancienne", () => {
    expect(estAReevaluer("conforme", "2025-01-01", limite)).toBe(true);
    expect(estAReevaluer("point_fort", "2024-12-31", limite)).toBe(true);
  });

  it("laisse tranquille une cotation conforme récente", () => {
    expect(estAReevaluer("conforme", "2026-01-01", limite)).toBe(false);
  });

  it("ignore les cotations non validées", () => {
    expect(estAReevaluer("nc_mineure", "2020-01-01", limite)).toBe(false);
    expect(estAReevaluer("point_attention", "2020-01-01", limite)).toBe(false);
    expect(estAReevaluer("non_evalue", "2020-01-01", limite)).toBe(false);
  });

  it("n'invente rien sans date d'évaluation", () => {
    expect(estAReevaluer("conforme", null, limite)).toBe(false);
  });
});
