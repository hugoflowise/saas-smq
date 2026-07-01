"use server";

import { headers } from "next/headers";
import { formatDate, todayISO } from "@/lib/format";
import { type FormulaireType, resoudreDefinitionFormulaire } from "@/lib/formulaire-modeles";
import { buildOfflineFormHtml } from "@/lib/offline-form-html";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";

const TITRES: Record<FormulaireType, string> = {
  suivi_consultant: "Suivi consultant",
  suivi_prestation: "Suivi de prestation",
};

type GenerationResult = { ok: true; html: string; filename: string } | { ok: false; error: string };

/**
 * Génère le fichier HTML autonome (hors-ligne) du formulaire demandé pour le
 * client courant. La définition personnalisée active y est embarquée avec sa
 * version ; le fichier est renvoyé sous forme de chaîne, téléchargée côté client.
 */
export async function genererFormulaireHorsLigneAction(
  type: FormulaireType,
): Promise<GenerationResult> {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return { ok: false, error: "Aucun client sélectionné." };
  }

  const admin = createAdminClient();
  const tid = ctx.effectiveTenantId;

  const { data: tenant } = await admin
    .from("tenants")
    .select("nom_societe, logo_url, survey_token")
    .eq("id", tid)
    .maybeSingle();

  if (!tenant?.survey_token) {
    return { ok: false, error: "Ce client n'a pas de lien d'enquête configuré." };
  }

  const { sections, version } = await resoudreDefinitionFormulaire(admin, tid, type);

  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const syncEndpoint = `${proto}://${host}/api/hors-ligne/${type}`;

  const html = buildOfflineFormHtml({
    type,
    titre: TITRES[type],
    sections,
    version,
    token: tenant.survey_token,
    nomSociete: tenant.nom_societe ?? "",
    logoUrl: tenant.logo_url ?? null,
    genereLe: formatDate(todayISO()),
    syncEndpoint,
  });

  return {
    ok: true,
    html,
    filename: `${type.replace(/_/g, "-")}-hors-ligne.html`,
  };
}
