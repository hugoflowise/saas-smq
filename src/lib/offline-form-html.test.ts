import { describe, expect, it } from "vitest";
import { buildOfflineFormHtml, type OfflineFormConfig } from "@/lib/offline-form-html";
import type { SectionConfig } from "@/lib/suivi-consultant";

const SECTIONS: SectionConfig[] = [
  {
    n: 1,
    title: "Identification",
    champs: [
      { key: "nom", label: "Nom", type: "text", required: true, verrou: true },
      { key: "note", label: "Satisfaction", type: "note5", required: true },
    ],
  },
];

function cfg(over: Partial<OfflineFormConfig> = {}): OfflineFormConfig {
  return {
    type: "suivi_consultant",
    titre: "Suivi consultant",
    sections: SECTIONS,
    version: 3,
    token: "abc-123",
    nomSociete: "Habeo",
    logoUrl: null,
    genereLe: "01/07/2026",
    syncEndpoint: "https://app.flowise.fr/api/hors-ligne/suivi_consultant",
    ...over,
  };
}

describe("buildOfflineFormHtml", () => {
  it("produit un document HTML autonome (aucun appel réseau au chargement)", () => {
    const html = buildOfflineFormHtml(cfg());
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<style>");
    expect(html).toContain("localStorage");
    // Pas de balise externe (script/link/img src http) chargée au démarrage.
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain("<link ");
  });

  it("embarque la définition, la version et le token du client", () => {
    const html = buildOfflineFormHtml(cfg());
    expect(html).toContain("Suivi consultant");
    expect(html).toContain("modèle v3");
    expect(html).toContain("abc-123");
    // Le libellé du champ figure dans la config JSON embarquée.
    expect(html).toContain("Satisfaction");
  });

  it("embarque l'endpoint de synchronisation", () => {
    const html = buildOfflineFormHtml(cfg());
    expect(html).toContain("/api/hors-ligne/suivi_consultant");
    expect(html).toContain("idempotencyKey");
  });

  it("cloisonne le stockage local par type + client + environnement", () => {
    const html = buildOfflineFormHtml(cfg());
    // La clé de file d'attente combine type, token et endpoint (isolation).
    expect(html).toContain(
      '"flowise_hl::" + CFG.type + "::" + CFG.token + "::" + CFG.syncEndpoint',
    );
  });

  it("affiche « modèle standard » quand la version est nulle", () => {
    const html = buildOfflineFormHtml(cfg({ version: null }));
    expect(html).toContain("modèle standard");
  });

  it("échappe le nom de société pour éviter toute injection HTML", () => {
    const html = buildOfflineFormHtml(cfg({ nomSociete: "<script>alert(1)</script>" }));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("active l'attestation sur l'honneur quand demandé", () => {
    const withAttest = buildOfflineFormHtml(cfg({ attestation: true }));
    expect(withAttest).toContain('"attestation":true');
    const without = buildOfflineFormHtml(cfg());
    expect(without).toContain('"attestation":false');
  });

  it("insère le logo quand il est fourni", () => {
    const html = buildOfflineFormHtml(cfg({ logoUrl: "https://cdn/logo.png" }));
    expect(html).toContain('src="https://cdn/logo.png"');
  });
});
