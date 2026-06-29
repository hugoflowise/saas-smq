"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DomaineSnapshot } from "@/app/(tenant)/strategie/domaine/domaine-snapshot";
import type { ActionResult } from "@/lib/actions/types";
import { canWrite } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionIndex, versionLettre } from "@/lib/versions";

// §4.3 : énoncé du périmètre + exclusions justifiées.
const exclusion = z.object({
  clause: z.string().trim(),
  intitule: z.string().trim(),
  justification: z.string().trim(),
});

const domaineSchema = z.object({
  perimetre: z.string().trim().optional(),
  sites: z.string().trim().optional(),
  exclusions: z.array(exclusion),
  dateEtablissement: z.string().optional(),
  prochaineRevue: z.string().optional(),
});

export async function saveDomaineAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = domaineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("domaine_application").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      perimetre: d.perimetre || null,
      sites: d.sites || null,
      exclusions: d.exclusions as Json,
      date_etablissement: d.dateEtablissement || null,
      prochaine_revue: d.prochaineRevue || null,
      updated_by: ctx.userId,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/domaine");
  return { ok: true };
}

/**
 * Fige une version du domaine d'application (instantané périmètre/exclusions).
 * Modèle léger sans circuit d'approbation : tout rédacteur peut publier.
 */
export async function publishDomaineVersionAction(): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  const tid = ctx.effectiveTenantId;

  const supabase = await createClient();
  const { data: domaine } = await supabase
    .from("domaine_application")
    .select("perimetre, sites, exclusions, date_etablissement, prochaine_revue")
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!domaine) {
    return { ok: false, error: "Renseignez d'abord le domaine d'application." };
  }

  const exRaw = Array.isArray(domaine.exclusions) ? domaine.exclusions : [];
  const exclusions = (exRaw as Record<string, unknown>[]).map((e) => ({
    clause: typeof e.clause === "string" ? e.clause : "",
    intitule: typeof e.intitule === "string" ? e.intitule : "",
    justification: typeof e.justification === "string" ? e.justification : "",
  }));
  const snapshot: DomaineSnapshot = {
    perimetre: domaine.perimetre,
    sites: domaine.sites,
    exclusions,
    dateEtablissement: domaine.date_etablissement,
    prochaineRevue: domaine.prochaine_revue,
  };

  // Version = lettre suivant la plus haute déjà attribuée (anti-collision après suppression).
  const { data: existantes } = await supabase
    .from("domaine_versions")
    .select("version")
    .eq("tenant_id", tid);
  const maxIndex = (existantes ?? []).reduce((m, v) => Math.max(m, versionIndex(v.version)), -1);
  const version = versionLettre(maxIndex + 1);

  const { error } = await supabase.from("domaine_versions").insert({
    tenant_id: tid,
    version,
    snapshot: snapshot as unknown as Json,
    published_by: ctx.userId,
  });
  if (error) return { ok: false, error: `Publication impossible : ${error.message}` };

  revalidatePath("/strategie/domaine");
  return { ok: true };
}

/** Supprime une version figée du domaine (créée par erreur). Suppression définitive. */
export async function deleteDomaineVersionAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domaine_versions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .select("id");
  if (error) return { ok: false, error: `Suppression impossible : ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: "Suppression refusée (droits ou version introuvable)." };
  }

  revalidatePath("/strategie/domaine");
  return { ok: true };
}
