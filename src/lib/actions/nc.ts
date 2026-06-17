"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

const base = {
  intitule: z.string().trim().min(2, "Intitulé requis."),
  description: z.string().trim().optional(),
  dateConstat: z.string().optional(),
  origine: z.enum(["audit_interne", "audit_externe", "client", "collaborateur", "rdd", "autre"]),
  gravite: z.enum(["mineure", "majeure", "critique"]),
  type: z.enum(["nc_produit", "nc_processus", "reclamation_client"]),
  statut: z.enum(["ouverte", "analysee", "action_definie", "cloturee", "efficace", "inefficace"]),
  processusConcerne: z.string().uuid().optional(),
};

const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

async function nextReference(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `NC-${year}-`;
  const { count } = await supabase
    .from("non_conformites")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .ilike("reference", `${prefix}%`);
  return `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function createNcAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) {
    return { ok: false, error: "Sélectionnez d'abord un client (tenant actif)." };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const reference = await nextReference(supabase, ctx.effectiveTenantId);

  const { error } = await supabase.from("non_conformites").insert({
    tenant_id: ctx.effectiveTenantId,
    reference,
    intitule: d.intitule,
    description: d.description ?? null,
    date_constat: d.dateConstat || new Date().toISOString().slice(0, 10),
    origine: d.origine,
    gravite: d.gravite,
    type: d.type,
    statut: d.statut,
    processus_concerne: d.processusConcerne ?? null,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/nc");
  return { ok: true };
}

const setStatutSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["ouverte", "analysee", "action_definie", "cloturee", "efficace", "inefficace"]),
});

/** Change uniquement le statut d'une NC (utilisé par le Kanban). */
export async function setNcStatutAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = setStatutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const isCloture = ["cloturee", "efficace", "inefficace"].includes(parsed.data.statut);
  const supabase = await createClient();
  const { error } = await supabase
    .from("non_conformites")
    .update({
      statut: parsed.data.statut,
      date_cloture: isCloture ? new Date().toISOString().slice(0, 10) : null,
      updated_by: ctx.userId,
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/nc");
  return { ok: true };
}

export async function updateNcAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  const isCloture = ["cloturee", "efficace", "inefficace"].includes(d.statut);

  const supabase = await createClient();
  const { error } = await supabase
    .from("non_conformites")
    .update({
      intitule: d.intitule,
      description: d.description ?? null,
      date_constat: d.dateConstat || new Date().toISOString().slice(0, 10),
      origine: d.origine,
      gravite: d.gravite,
      type: d.type,
      statut: d.statut,
      processus_concerne: d.processusConcerne ?? null,
      date_cloture: isCloture ? new Date().toISOString().slice(0, 10) : null,
      updated_by: ctx.userId,
    })
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/nc");
  return { ok: true };
}
