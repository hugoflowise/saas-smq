"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ContexteSnapshot } from "@/app/(tenant)/strategie/contexte/contexte-snapshot";
import type { ActionResult } from "@/lib/actions/types";
import { canWrite } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionIndex, versionLettre } from "@/lib/versions";

// Chaque case SWOT/PESTEL est une liste de points (chaînes).
const liste = z.array(z.string());
const contexteSchema = z.object({
  swot: z.object({
    forces: liste,
    faiblesses: liste,
    opportunites: liste,
    menaces: liste,
  }),
  pestel: z.object({
    politique: liste,
    economique: liste,
    sociologique: liste,
    technologique: liste,
    ecologique: liste,
    legal: liste,
  }),
  dateRevue: z.string().optional(),
  prochainRevue: z.string().optional(),
});

export async function saveContexteAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = contexteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("contexte_organisme").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      analyse_swot: d.swot as Json,
      analyse_pestel: d.pestel as Json,
      date_revue: d.dateRevue || null,
      prochain_revue: d.prochainRevue || null,
      updated_by: ctx.userId,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/contexte");
  return { ok: true };
}

/** Enregistre la référence documentaire de l'analyse de contexte (codification). */
export async function saveContexteReferenceAction(reference: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase.from("contexte_organisme").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      reference: reference.trim() || null,
      updated_by: ctx.userId,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/contexte");
  return { ok: true };
}

/**
 * Fige une version de l'analyse de contexte (instantané SWOT/PESTEL + référence).
 * Modèle léger sans circuit d'approbation : tout rédacteur peut publier.
 */
export async function publishContexteVersionAction(): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  const tid = ctx.effectiveTenantId;

  const supabase = await createClient();
  const { data: contexte } = await supabase
    .from("contexte_organisme")
    .select("analyse_swot, analyse_pestel, date_revue, prochain_revue, reference")
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!contexte) {
    return { ok: false, error: "Renseignez d'abord l'analyse de contexte." };
  }

  const swotRaw = (contexte.analyse_swot ?? {}) as Record<string, string[]>;
  const pestelRaw = (contexte.analyse_pestel ?? {}) as Record<string, string[]>;
  const liste = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  const snapshot: ContexteSnapshot = {
    reference: contexte.reference ?? null,
    swot: {
      forces: liste(swotRaw.forces),
      faiblesses: liste(swotRaw.faiblesses),
      opportunites: liste(swotRaw.opportunites),
      menaces: liste(swotRaw.menaces),
    },
    pestel: {
      politique: liste(pestelRaw.politique),
      economique: liste(pestelRaw.economique),
      sociologique: liste(pestelRaw.sociologique),
      technologique: liste(pestelRaw.technologique),
      ecologique: liste(pestelRaw.ecologique),
      legal: liste(pestelRaw.legal),
    },
    dateRevue: contexte.date_revue,
    prochainRevue: contexte.prochain_revue,
  };

  // Version = lettre suivant la plus haute déjà attribuée (anti-collision après suppression).
  const { data: existantes } = await supabase
    .from("contexte_versions")
    .select("version")
    .eq("tenant_id", tid);
  const maxIndex = (existantes ?? []).reduce((m, v) => Math.max(m, versionIndex(v.version)), -1);
  const version = versionLettre(maxIndex + 1);

  const { error } = await supabase.from("contexte_versions").insert({
    tenant_id: tid,
    version,
    snapshot: snapshot as unknown as Json,
    published_by: ctx.userId,
  });
  if (error) return { ok: false, error: `Publication impossible : ${error.message}` };

  revalidatePath("/strategie/contexte");
  return { ok: true };
}

/** Supprime une version figée du contexte (créée par erreur). Suppression définitive. */
export async function deleteContexteVersionAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contexte_versions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .select("id");
  if (error) return { ok: false, error: `Suppression impossible : ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: "Suppression refusée (droits ou version introuvable)." };
  }

  revalidatePath("/strategie/contexte");
  return { ok: true };
}
