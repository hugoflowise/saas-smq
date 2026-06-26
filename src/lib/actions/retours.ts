"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { notifyUsers } from "@/lib/notifications";
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

  // État courant (pour ne notifier que sur un vrai changement de statut)
  const { data: avant } = await supabase
    .from("retours")
    .select("statut, titre, created_by")
    .eq("id", d.id)
    .maybeSingle();

  const { error } = await supabase
    .from("retours")
    .update({ statut: d.statut, note_admin: d.noteAdmin || null })
    .eq("id", d.id);
  if (error) return { ok: false, error: error.message };

  // Notification in-app (pas d'e-mail) à l'auteur quand on passe en cours / traité.
  const statutChange = avant && avant.statut !== d.statut;
  const aNotifier = d.statut === "en_cours" || d.statut === "traite";
  if (statutChange && aNotifier && avant?.created_by) {
    const titre =
      d.statut === "traite"
        ? "Votre signalement a été traité"
        : "Votre signalement est en cours de traitement";
    await notifyUsers(
      [avant.created_by],
      { type: "retour_update", title: titre, body: avant.titre },
      { inAppOnly: true },
    );
  }

  revalidatePath("/admin/retours");
  return { ok: true };
}
