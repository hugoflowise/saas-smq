import { describe, expect, it } from "vitest";
import { AUDIT_ENTITY, entityLabel, fieldLabel } from "./journal";

describe("entityLabel", () => {
  it("renvoie le libellé lisible d'un type connu", () => {
    expect(entityLabel("politique_qualite")).toBe("Politique qualité");
    expect(entityLabel("actions")).toBe("Action");
  });
  it("renvoie le type brut si inconnu", () => {
    expect(entityLabel("table_inconnue")).toBe("table_inconnue");
  });
});

describe("fieldLabel", () => {
  it("remplace les underscores par des espaces", () => {
    expect(fieldLabel("description_courte")).toBe("description courte");
  });
});

describe("AUDIT_ENTITY", () => {
  it("fournit un href absolu pour chaque entité", () => {
    for (const meta of Object.values(AUDIT_ENTITY)) {
      expect(meta.href === null || meta.href.startsWith("/")).toBe(true);
    }
  });
});
