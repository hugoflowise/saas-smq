"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const base = {
  objet: z.string().trim().min(2, "Objet requis."),
  finalite: z.string().trim().optional(),
  consequences: z.string().trim().optional(),
  ressources: z.string().trim().optional(),
  responsableId: z.string().uuid().optional(),
  datePrevue: z.string().optional(),
  dateRealisee: z.string().optional(),
  statut: z.enum(["planifiee", "en_cours", "realisee", "abandonnee"]),
  commentaire: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    objet: d.objet,
    finalite: d.finalite ?? null,
    consequences: d.consequences ?? null,
    ressources: d.ressources ?? null,
    responsable_id: d.responsableId || null,
    date_prevue: d.datePrevue || null,
    date_realisee: d.dateRealisee || null,
    statut: d.statut,
    commentaire: d.commentaire ?? null,
  };
}

export async function createModificationSmqAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("modifications_smq")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/modifications-smq");
  return { ok: true };
}

export async function updateModificationSmqAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("modifications_smq")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/modifications-smq");
  return { ok: true };
}

export async function deleteModificationSmqAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("modifications_smq", id);
  if (r.ok) revalidatePath("/modifications-smq");
  return r;
}
