import { describe, expect, it } from "vitest";
import { statutDocumentNatif } from "./documents";

describe("statutDocumentNatif", () => {
  it("mappe les statuts natifs vers le statut unifié", () => {
    expect(statutDocumentNatif("publiee")).toBe("en_vigueur");
    expect(statutDocumentNatif("approuvee")).toBe("en_vigueur");
    expect(statutDocumentNatif("archivee")).toBe("archive");
    expect(statutDocumentNatif("en_revue")).toBe("en_revue");
    expect(statutDocumentNatif("brouillon")).toBe("brouillon");
    expect(statutDocumentNatif("inconnu")).toBe("brouillon");
  });
});
