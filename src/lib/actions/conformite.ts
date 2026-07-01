"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const schema = z.object({
  referentielId: z.string().uuid(),
  cotation: z.enum([
    "non_evalue",
    "conforme",
    "point_fort",
    "point_attention",
    "nc_mineure",
    "nc_majeure",
    "non_applicable",
  ]),
  commentaire: z.string().trim().optional(),
});

export async function setCotationAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("conformite_evaluation").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      referentiel_iso_id: d.referentielId,
      cotation: d.cotation,
      commentaire: d.commentaire ?? null,
      date_evaluation: todayISO(),
      evaluateur_id: ctx.userId,
    },
    { onConflict: "tenant_id,referentiel_iso_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/conformite");
  return { ok: true };
}

// --- Auto-diagnostic MASE (noté) -------------------------------------------
// Pour MASE, l'évaluation est un score : points obtenus sur la question (ou
// question neutralisée, exclue du calcul). On n'écrit que ces colonnes ;
// `cotation` (qualitative 9001) reste à sa valeur par défaut, non utilisée ici.

const maseSchema = z.object({
  referentielId: z.string().uuid(),
  pointsObtenus: z.number().int().min(0).nullable(),
  neutralisee: z.boolean(),
});

export async function setMaseScoreAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = maseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("conformite_evaluation").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      referentiel_iso_id: d.referentielId,
      points_obtenus: d.neutralisee ? null : d.pointsObtenus,
      neutralisee: d.neutralisee,
      date_evaluation: todayISO(),
      evaluateur_id: ctx.userId,
    },
    { onConflict: "tenant_id,referentiel_iso_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/conformite");
  return { ok: true };
}
