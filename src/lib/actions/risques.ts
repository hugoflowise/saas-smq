"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

const base = {
  intitule: z.string().trim().min(2, "Intitulé requis."),
  type: z.enum(["risque", "opportunite"]),
  processusId: z.string().uuid().optional(),
  cause: z.string().trim().optional(),
  consequence: z.string().trim().optional(),
  gravite: z.coerce.number().int().min(1).max(5),
  probabilite: z.coerce.number().int().min(1).max(5),
  traitementPrevu: z.string().trim().optional(),
  statut: z.enum(["identifie", "en_traitement", "maitrise", "cloture"]),
  dateRevue: z.string().optional(),
};

const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    intitule: d.intitule,
    type: d.type,
    processus_id: d.processusId ?? null,
    cause: d.cause ?? null,
    consequence: d.consequence ?? null,
    gravite: d.gravite,
    probabilite: d.probabilite,
    traitement_prevu: d.traitementPrevu ?? null,
    statut: d.statut,
    date_revue: d.dateRevue || null,
  };
}

export async function createRoAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("risques_opportunites").insert({
    tenant_id: ctx.effectiveTenantId,
    ...payload(parsed.data),
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/risques");
  return { ok: true };
}

export async function updateRoAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("risques_opportunites")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/risques");
  return { ok: true };
}
