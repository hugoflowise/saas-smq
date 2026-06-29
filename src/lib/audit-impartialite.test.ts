import { describe, expect, it } from "vitest";
import {
  IMPARTIALITE_MARQUEUR,
  messageImpartialite,
  type ProcessusPilotage,
  processusEnConflit,
} from "@/lib/audit-impartialite";

const proc = (id: string, nom: string, piloteIds: string[]): ProcessusPilotage => ({
  id,
  nom,
  piloteIds,
});

describe("processusEnConflit (impartialité §9.2.2)", () => {
  it("ne signale aucun conflit si l'auditeur n'est pilote d'aucun processus audité", () => {
    const processus = [proc("p1", "Achats", ["pilote-a"]), proc("p2", "Production", ["pilote-b"])];
    expect(processusEnConflit("auditeur-x", processus)).toEqual([]);
  });

  it("signale le processus dont l'auditeur est pilote", () => {
    const processus = [proc("p1", "Achats", ["aud-1"]), proc("p2", "Production", ["pilote-b"])];
    expect(processusEnConflit("aud-1", processus)).toEqual(["Achats"]);
  });

  it("détecte le conflit sur plusieurs processus audités à la fois", () => {
    const processus = [
      proc("p1", "Achats", ["aud-1"]),
      proc("p2", "Production", ["aud-1", "pilote-b"]),
      proc("p3", "RH", ["pilote-c"]),
    ];
    expect(processusEnConflit("aud-1", processus)).toEqual(["Achats", "Production"]);
  });

  it("ne renvoie rien si l'auditeur n'est pas désigné", () => {
    const processus = [proc("p1", "Achats", ["aud-1"])];
    expect(processusEnConflit(undefined, processus)).toEqual([]);
    expect(processusEnConflit(null, processus)).toEqual([]);
  });
});

describe("messageImpartialite", () => {
  it("renvoie null sans conflit", () => {
    expect(messageImpartialite([])).toBeNull();
  });

  it("construit un message porteur du marqueur §9.2.2 listant les processus", () => {
    const msg = messageImpartialite(["Achats", "Production"]);
    expect(msg).toContain(IMPARTIALITE_MARQUEUR);
    expect(msg).toContain("Achats");
    expect(msg).toContain("Production");
  });
});
