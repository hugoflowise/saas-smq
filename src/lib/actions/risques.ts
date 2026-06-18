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
  revalidatePath(`/risques/${parsed.data.id}`);
  return { ok: true };
}

// ------------------------------------------ Actions de traitement (R&O -> actions)
const createActionFromRo = z.object({
  roId: z.string().uuid(),
  descriptionCourte: z.string().trim().min(2, "Description requise."),
  priorite: z.enum(["p1", "p2", "p3"]),
  datePrevue: z.string().optional(),
});

export async function createActionFromRoAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = createActionFromRo.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  const supabase = await createClient();

  const year = new Date().getFullYear();
  const prefix = `ACT-${year}-`;
  const { count } = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.effectiveTenantId)
    .ilike("reference", `${prefix}%`);
  const reference = `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: action, error: actionError } = await supabase
    .from("actions")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      reference,
      description_courte: d.descriptionCourte,
      origine: "r_o",
      type: "preventive",
      priorite: d.priorite,
      date_prevue: d.datePrevue || null,
      statut: "a_faire",
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (actionError || !action) {
    return { ok: false, error: `Création de l'action impossible : ${actionError?.message}` };
  }

  const { error: linkError } = await supabase
    .from("ro_actions")
    .insert({ tenant_id: ctx.effectiveTenantId, ro_id: d.roId, action_id: action.id });
  if (linkError) return { ok: false, error: linkError.message };

  revalidatePath(`/risques/${d.roId}`);
  revalidatePath("/actions");
  return { ok: true };
}

export async function unlinkRoActionAction(roId: string, actionId: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ro_actions")
    .delete()
    .eq("tenant_id", ctx.effectiveTenantId)
    .eq("ro_id", roId)
    .eq("action_id", actionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/risques/${roId}`);
  return { ok: true };
}
