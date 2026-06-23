"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { getTenantContext } from "@/lib/tenant-context";
import { setSimulatedRole } from "@/lib/view-as-cookie";

const schema = z.object({
  // null => revenir à la vue administrateur réelle.
  role: z.enum(["dirigeant", "manager", "auditeur"]).nullable(),
});

/**
 * Active ou désactive la vue simulée. Réservé aux vrais admins Flowise :
 * on contrôle le rôle réel, jamais le rôle (potentiellement déjà simulé).
 */
export async function setViewAsAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.realIsAdmin) return { ok: false, error: "Action réservée à l'administrateur." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Rôle invalide." };

  await setSimulatedRole(parsed.data.role);
  revalidatePath("/", "layout");
  return { ok: true };
}
