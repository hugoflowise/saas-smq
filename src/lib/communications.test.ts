import { describe, expect, it } from "vitest";
import { appliquerVariables, construireMailto } from "./communications";

describe("appliquerVariables", () => {
  it("remplace les variables connues", () => {
    expect(appliquerVariables("Politique de {societe}", { societe: "Acme" })).toBe(
      "Politique de Acme",
    );
  });
  it("laisse les variables absentes ou vides telles quelles", () => {
    expect(appliquerVariables("Bonjour {destinataire}", {})).toBe("Bonjour {destinataire}");
    expect(appliquerVariables("Bonjour {destinataire}", { destinataire: "" })).toBe(
      "Bonjour {destinataire}",
    );
  });
});

describe("construireMailto", () => {
  it("encode l'objet et le corps", () => {
    const lien = construireMailto({ to: "lea@flowise.fr", objet: "Sujet & test", corps: "L1\nL2" });
    expect(lien.startsWith("mailto:lea%40flowise.fr?")).toBe(true);
    expect(lien).toContain("subject=Sujet%20%26%20test");
    expect(lien).toContain("body=L1%0AL2");
  });
  it("gère un destinataire vide", () => {
    expect(construireMailto({ to: "", objet: "X", corps: "" })).toBe("mailto:?subject=X");
  });
});
