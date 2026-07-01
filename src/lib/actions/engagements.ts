"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { softDeleteRow } from "@/lib/actions/soft-delete";
import type { ActionResult } from "@/lib/actions/types";
import { canWrite } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  if (!canWrite(ctx.role)) return null;
  const supabase = await createClient();
  return { supabase, tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

const createSchema = z.object({ libelle: z.string().trim().min(2, "Engagement requis.") });
const updateSchema = z.object({
  id: z.string().uuid(),
  libelle: z.string().trim().min(2, "Engagement requis."),
});

/** Ajoute un engagement de la politique qualité (en fin de liste). */
export async function createEngagementAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Droits insuffisants ou aucun client actif." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };

  // Ordre = fin de liste.
  const { data: last } = await c.supabase
    .from("politique_engagements")
    .select("ordre")
    .eq("tenant_id", c.tenantId)
    .is("deleted_at", null)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await c.supabase.from("politique_engagements").insert({
    tenant_id: c.tenantId,
    libelle: parsed.data.libelle,
    ordre: (last?.ordre ?? 0) + 1,
    created_by: c.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}

export async function updateEngagementAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Droits insuffisants ou aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };

  const { error } = await c.supabase
    .from("politique_engagements")
    .update({ libelle: parsed.data.libelle, updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}

/** Met un engagement à la corbeille (les objectifs liés sont simplement déliés). */
export async function deleteEngagementAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("politique_engagements", id);
  if (r.ok) revalidatePath("/strategie/objectifs");
  return r;
}
