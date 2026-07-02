"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

// Tables porteuses d'éléments « proposés à valider » et la page à rafraîchir.
// Liste blanche : empêche de valider une table arbitraire depuis le client.
const TABLES_PROPOSEES = {
  processus: "/processus",
  actions: "/actions",
  parties_interessees: "/strategie/parties-prenantes",
} as const;

const tableSchema = z.enum(["processus", "actions", "parties_interessees"]);
type TableProposee = z.infer<typeof tableSchema>;

const validerSchema = z.object({ table: tableSchema, id: z.string().uuid() });
const validerToutSchema = z.object({ table: tableSchema });

/** Valide un élément prérempli : il est désormais pris en compte (compteurs inclus). */
export async function validerElementAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = validerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const error = await marquerValide(parsed.data.table, ctx.effectiveTenantId, ctx.userId, {
    id: parsed.data.id,
  });
  if (error) return { ok: false, error };

  revalidatePath(TABLES_PROPOSEES[parsed.data.table]);
  return { ok: true };
}

/**
 * Refuse un élément prérempli : il est supprimé. Réservé aux éléments encore
 * « proposés » et non validés (un élément validé se supprime par les écrans
 * habituels, avec leurs garde-fous).
 */
export async function refuserElementAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = validerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const error = await supprimerPropose(parsed.data.table, ctx.effectiveTenantId, {
    id: parsed.data.id,
  });
  if (error) return { ok: false, error };

  revalidatePath(TABLES_PROPOSEES[parsed.data.table]);
  return { ok: true };
}

/** Valide d'un coup tous les éléments proposés non encore validés d'un module. */
export async function validerToutAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = validerToutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const error = await marquerValide(parsed.data.table, ctx.effectiveTenantId, ctx.userId, {});
  if (error) return { ok: false, error };

  revalidatePath(TABLES_PROPOSEES[parsed.data.table]);
  return { ok: true };
}

/** Refuse d'un coup tous les éléments proposés non encore validés d'un module. */
export async function refuserToutAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = validerToutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const error = await supprimerPropose(parsed.data.table, ctx.effectiveTenantId, {});
  if (error) return { ok: false, error };

  revalidatePath(TABLES_PROPOSEES[parsed.data.table]);
  return { ok: true };
}

/**
 * Marque comme validé soit un élément précis (target.id), soit tous les éléments
 * proposés non validés du module. Aiguillage explicite par table pour conserver
 * le typage du client Supabase.
 */
async function marquerValide(
  table: TableProposee,
  tenantId: string,
  userId: string,
  target: { id?: string },
): Promise<string | null> {
  const supabase = await createClient();
  const patch = { valide_le: new Date().toISOString(), updated_by: userId };

  // Aiguillage par table (typage Supabase préservé) : soit un id précis,
  // soit tous les éléments proposés non encore validés du module.
  if (table === "processus") {
    let q = supabase.from("processus").update(patch).eq("tenant_id", tenantId);
    q = target.id ? q.eq("id", target.id) : q.eq("propose", true).is("valide_le", null);
    return (await q).error?.message ?? null;
  }
  if (table === "actions") {
    let q = supabase.from("actions").update(patch).eq("tenant_id", tenantId);
    q = target.id ? q.eq("id", target.id) : q.eq("propose", true).is("valide_le", null);
    return (await q).error?.message ?? null;
  }
  let q = supabase.from("parties_interessees").update(patch).eq("tenant_id", tenantId);
  q = target.id ? q.eq("id", target.id) : q.eq("propose", true).is("valide_le", null);
  return (await q).error?.message ?? null;
}

/**
 * Supprime soit un élément proposé précis (target.id), soit tous les éléments
 * proposés non validés du module (refus en masse). Aiguillage explicite par table
 * pour conserver le typage du client Supabase. Le double filtre `propose=true` +
 * `valide_le is null` empêche de supprimer un élément déjà validé par ce biais.
 */
async function supprimerPropose(
  table: TableProposee,
  tenantId: string,
  target: { id?: string },
): Promise<string | null> {
  const supabase = await createClient();

  if (table === "processus") {
    let q = supabase.from("processus").delete().eq("tenant_id", tenantId);
    q = target.id ? q.eq("id", target.id) : q;
    return (await q.eq("propose", true).is("valide_le", null)).error?.message ?? null;
  }
  if (table === "actions") {
    let q = supabase.from("actions").delete().eq("tenant_id", tenantId);
    q = target.id ? q.eq("id", target.id) : q;
    return (await q.eq("propose", true).is("valide_le", null)).error?.message ?? null;
  }
  let q = supabase.from("parties_interessees").delete().eq("tenant_id", tenantId);
  q = target.id ? q.eq("id", target.id) : q;
  return (await q.eq("propose", true).is("valide_le", null)).error?.message ?? null;
}
