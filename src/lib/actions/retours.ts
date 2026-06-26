"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const createSchema = z.object({
  type: z.enum(["bug", "amelioration", "remarque"]),
  titre: z.string().trim().min(3, "Décrivez votre retour en quelques mots."),
  description: z.string().trim().optional(),
  pageUrl: z.string().trim().optional(),
});

/** Soumission d'un retour par n'importe quel utilisateur authentifié. */
export async function createRetourAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("retours").insert({
    tenant_id: ctx.effectiveTenantId ?? null,
    type: d.type,
    titre: d.titre,
    description: d.description || null,
    page_url: d.pageUrl || null,
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["nouveau", "en_cours", "traite", "rejete"]),
  noteAdmin: z.string().trim().optional(),
});

/** Traitement d'un retour (admin Flowise) : statut + note interne. */
export async function updateRetourAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (profile?.role !== "admin_flowise") {
    return { ok: false, error: "Action réservée à l'administrateur Flowise." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const { error } = await supabase
    .from("retours")
    .update({ statut: d.statut, note_admin: d.noteAdmin || null })
    .eq("id", d.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/retours");
  return { ok: true };
}
