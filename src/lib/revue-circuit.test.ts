import { describe, expect, it } from "vitest";
import { messageRevueIncomplete, type RevueChamps, revueComplete } from "@/lib/revue-circuit";

/** Revue entièrement remplie (toutes rubriques obligatoires renseignées). */
const revueComplete_: RevueChamps = {
  entree_actions_anterieures: "Suivi des actions",
  entree_evolution_contexte: "Enjeux internes/externes",
  entree_performance_synthese: "Synthèse perf",
  entree_ressources: "Ressources adéquates",
  entree_efficacite_actions: "Efficacité R&O",
  entree_opportunites: "Opportunités",
  sortie_amelioration: "Décisions",
  sortie_changements: "Changements",
  sortie_ressources: "Besoins ressources",
};

describe("revueComplete (verrou §9.3)", () => {
  it("est complète quand les 6 entrées et 3 sorties sont remplies", () => {
    const r = revueComplete(revueComplete_);
    expect(r.complete).toBe(true);
    expect(r.manquants).toEqual([]);
  });

  it("liste toutes les rubriques quand la revue est vide", () => {
    const vide: RevueChamps = {
      entree_actions_anterieures: null,
      entree_evolution_contexte: null,
      entree_performance_synthese: null,
      entree_ressources: null,
      entree_efficacite_actions: null,
      entree_opportunites: null,
      sortie_amelioration: null,
      sortie_changements: null,
      sortie_ressources: null,
    };
    const r = revueComplete(vide);
    expect(r.complete).toBe(false);
    expect(r.manquants).toHaveLength(9);
  });

  it("considère un champ rempli d'espaces comme manquant (trim)", () => {
    const r = revueComplete({ ...revueComplete_, sortie_changements: "   " });
    expect(r.complete).toBe(false);
    expect(r.manquants).toEqual(["Sortie — Besoins de changement du SMQ"]);
  });

  it("signale une seule rubrique manquante", () => {
    const r = revueComplete({ ...revueComplete_, entree_ressources: "" });
    expect(r.manquants).toEqual(["d) Adéquation des ressources"]);
  });
});

describe("messageRevueIncomplete", () => {
  it("accorde le message au singulier", () => {
    expect(messageRevueIncomplete(["d) Adéquation des ressources"])).toContain("la rubrique");
  });

  it("accorde le message au pluriel", () => {
    const msg = messageRevueIncomplete(["a", "b"]);
    expect(msg).toContain("les rubriques");
    expect(msg).toContain("a ; b");
  });
});
