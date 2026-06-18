"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

const piBase = {
  nom: z.string().trim().min(2, "Nom requis."),
  type: z.enum(["client", "fournisseur", "collaborateur", "autorite", "actionnaire", "autre"]),
  attentes: z.string().trim().optional(),
  exigences: z.string().trim().optional(),
  niveauInfluence: z.enum(["faible", "moyen", "fort"]),
};
const piCreate = z.object(piBase);
const piUpdate = z.object({ id: z.string().uuid(), ...piBase });

function piPayload(d: z.infer<typeof piCreate>) {
  return {
    nom: d.nom,
    type: d.type,
    attentes: d.attentes ?? null,
    exigences: d.exigences ?? null,
    niveau_influence: d.niveauInfluence,
  };
}

export async function createPiAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = piCreate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("parties_interessees").insert({
    tenant_id: ctx.effectiveTenantId,
    ...piPayload(parsed.data),
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}

export async function updatePiAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = piUpdate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("parties_interessees")
    .update({ ...piPayload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}

const contexteSchema = z.object({
  swot: z.object({
    forces: z.string(),
    faiblesses: z.string(),
    opportunites: z.string(),
    menaces: z.string(),
  }),
  pestel: z.object({
    politique: z.string(),
    economique: z.string(),
    sociologique: z.string(),
    technologique: z.string(),
    ecologique: z.string(),
    legal: z.string(),
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
