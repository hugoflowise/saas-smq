import { describe, expect, it } from "vitest";
import { aDesAlertes, type EcheancesTenant } from "./echeances";

const vide: EcheancesTenant = { echeances: [], docsAReviser: [], actionsRetard: [] };

describe("aDesAlertes", () => {
  it("renvoie false quand il n'y a rien à signaler", () => {
    expect(aDesAlertes(vide)).toBe(false);
  });

  it("renvoie true s'il y a une échéance à venir", () => {
    expect(
      aDesAlertes({
        ...vide,
        echeances: [{ date: "2026-07-01", label: "Audit", href: "/audits/1" }],
      }),
    ).toBe(true);
  });

  it("renvoie true s'il y a un document à réviser", () => {
    expect(
      aDesAlertes({
        ...vide,
        docsAReviser: [{ id: "1", code: "PR-01", titre: "Procédure", date: "2026-07-01" }],
      }),
    ).toBe(true);
  });

  it("renvoie true s'il y a une action en retard", () => {
    expect(
      aDesAlertes({
        ...vide,
        actionsRetard: [{ id: "1", reference: "A-01", label: "Action", date: "2026-06-01" }],
      }),
    ).toBe(true);
  });
});
