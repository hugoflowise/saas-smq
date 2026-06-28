import { describe, expect, it } from "vitest";
import {
  chronoFromReference,
  formatReference,
  normalizeTrigramme,
  TYPE_MAITRISE_TO_FAMILLE,
} from "./codification";

describe("formatReference", () => {
  it("assemble FAMILLE_PROCESSUS_CHRONO avec un numéro sur 3 chiffres", () => {
    expect(formatReference("PR", "SMQ", 1)).toBe("PR_SMQ_001");
    expect(formatReference("DG", "DIR", 42)).toBe("DG_DIR_042");
    expect(formatReference("EN", "RH", 1234)).toBe("EN_RH_1234");
  });
});

describe("chronoFromReference", () => {
  it("extrait le numéro quand le préfixe correspond", () => {
    expect(chronoFromReference("PR_SMQ_004", "PR", "SMQ")).toBe(4);
    expect(chronoFromReference("dg_smq_004", "DG", "SMQ")).toBe(4); // insensible à la casse
  });

  it("renvoie null si la famille ou le processus diffère", () => {
    expect(chronoFromReference("PR_SMQ_004", "EN", "SMQ")).toBeNull();
    expect(chronoFromReference("PR_SMQ_004", "PR", "DIR")).toBeNull();
    expect(chronoFromReference("PR-SMQ-004", "PR", "SMQ")).toBeNull(); // mauvais séparateur
    expect(chronoFromReference("PR_SMQ_004_v2", "PR", "SMQ")).toBeNull();
  });
});

describe("normalizeTrigramme", () => {
  it("met en majuscules, retire le non-alphanumérique et tronque à 6", () => {
    expect(normalizeTrigramme(" smq ")).toBe("SMQ");
    expect(normalizeTrigramme("r&d")).toBe("RD");
    expect(normalizeTrigramme("abcdefgh")).toBe("ABCDEF");
  });
});

describe("TYPE_MAITRISE_TO_FAMILLE", () => {
  it("mappe les types codifiables et exclut l'externe", () => {
    expect(TYPE_MAITRISE_TO_FAMILLE.manuel).toBe("DG");
    expect(TYPE_MAITRISE_TO_FAMILLE.enregistrement).toBe("EN");
    expect(TYPE_MAITRISE_TO_FAMILLE.formulaire).toBe("FO");
    expect(TYPE_MAITRISE_TO_FAMILLE.document_externe).toBeNull();
  });
});
