"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  return { supabase: await createClient(), tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

const pointSchema = z.object({
  sujet: z.string().trim().default(""),
  prepa: z.string().trim().default(""),
  discussion: z.string().trim().default(""),
  decision: z.string().trim().default(""),
  statut: z.enum(["a_voir", "traite", "reporte"]).default("a_voir"),
});

const base = {
  titre: z.string().trim().min(2, "Titre requis."),
  type: z.enum(["comite_qhse", "reunion_echange", "revue", "autre"]),
  datePrevue: z.string().optional(),
  dateRealisation: z.string().optional(),
  lieu: z.string().trim().optional(),
  animateur: z.string().trim().optional(),
  objectifs: z.string().trim().optional(),
  convoques: z.string().trim().optional(),
  presents: z.string().trim().optional(),
  synthese: z.string().trim().optional(),
  statut: z.enum(["planifiee", "terminee"]),
  points: z.array(pointSchema).optional(),
};
const createSchema = z.object({ ...base, statut: base.statut.optional() });
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    titre: d.titre,
    type: d.type,
    date_prevue: d.datePrevue || null,
    date_realisation: d.dateRealisation || null,
    lieu: d.lieu ?? null,
    animateur: d.animateur ?? null,
    objectifs: d.objectifs ?? null,
    convoques: d.convoques ?? null,
    presents: d.presents ?? null,
    synthese: d.synthese ?? null,
    statut: d.statut ?? "planifiee",
    points: (d.points ?? []) as unknown as Json,
  };
}

export async function createReunionAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("reunions")
    .insert({ tenant_id: c.tenantId, ...payload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/reunions");
  return { ok: true };
}

export async function updateReunionAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("reunions")
    .update({ ...payload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/reunions/${parsed.data.id}`);
  revalidatePath("/reunions");
  return { ok: true };
}

export async function deleteReunionAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("reunions", id);
  if (r.ok) revalidatePath("/reunions");
  return r;
}

const actionSchema = z.object({
  reunionId: z.string().uuid(),
  descriptionCourte: z.string().trim().min(2, "Description requise."),
  priorite: z.enum(["p1", "p2", "p3"]),
  datePrevue: z.string().optional(),
});

export async function createActionFromReunionAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const year = todayISO().slice(0, 4);
  const prefix = `ACT-${year}-`;
  const { count } = await c.supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", c.tenantId)
    .ilike("reference", `${prefix}%`);
  const reference = `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: action, error: actionError } = await c.supabase
    .from("actions")
    .insert({
      tenant_id: c.tenantId,
      reference,
      description_courte: d.descriptionCourte,
      origine: "reunion",
      type: "corrective",
      priorite: d.priorite,
      date_prevue: d.datePrevue || null,
      statut: "a_faire",
      created_by: c.userId,
    })
    .select("id")
    .single();
  if (actionError || !action) {
    return { ok: false, error: `Création de l'action impossible : ${actionError?.message}` };
  }

  const { error: linkError } = await c.supabase
    .from("reunion_actions")
    .insert({ tenant_id: c.tenantId, reunion_id: d.reunionId, action_id: action.id });
  if (linkError) return { ok: false, error: linkError.message };

  revalidatePath(`/reunions/${d.reunionId}`);
  revalidatePath("/actions");
  return { ok: true };
}

export async function unlinkReunionActionAction(
  reunionId: string,
  actionId: string,
): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const { error } = await c.supabase
    .from("reunion_actions")
    .delete()
    .eq("tenant_id", c.tenantId)
    .eq("reunion_id", reunionId)
    .eq("action_id", actionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/reunions/${reunionId}`);
  return { ok: true };
}
