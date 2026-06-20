"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const createSchema = z.object({
  nom: z.string().trim().min(2, "Nom requis."),
  description: z.string().trim().optional(),
  processusId: z.string().uuid().optional(),
  type: z.enum(["numeric", "percentage", "count", "duration"]),
  unite: z.string().trim().optional(),
  cible: z.coerce.number().optional(),
  seuilMin: z.coerce.number().optional(),
  seuilMax: z.coerce.number().optional(),
  frequence: z.enum(["quotidien", "hebdo", "mensuel", "trimestriel", "annuel"]),
});

export async function createIndicateurAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("indicateurs").insert({
    tenant_id: ctx.effectiveTenantId,
    nom: d.nom,
    description: d.description ?? null,
    processus_id: d.processusId ?? null,
    type: d.type,
    unite: d.unite ?? null,
    cible: d.cible ?? null,
    seuil_alerte_min: d.seuilMin ?? null,
    seuil_alerte_max: d.seuilMax ?? null,
    frequence_mesure: d.frequence,
    source: "manuel",
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/indicateurs");
  return { ok: true };
}

const valeurSchema = z.object({
  indicateurId: z.string().uuid(),
  valeur: z.coerce.number(),
  dateMesure: z.string().optional(),
  commentaire: z.string().trim().optional(),
});

export async function addValeurAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = valeurSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Valeur invalide." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("indicateurs_valeurs").insert({
    tenant_id: ctx.effectiveTenantId,
    indicateur_id: d.indicateurId,
    valeur: d.valeur,
    date_mesure: d.dateMesure || new Date().toISOString().slice(0, 10),
    commentaire: d.commentaire ?? null,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/indicateurs/${d.indicateurId}`);
  revalidatePath("/indicateurs");
  return { ok: true };
}
