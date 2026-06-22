"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

/** Enregistre les mots-clés de veille du client (réservé dirigeant/admin). */
export async function setMotsClesVeilleAction(motsCles: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (ctx.role !== "admin_flowise" && ctx.role !== "dirigeant") {
    return { ok: false, error: "Droits insuffisants." };
  }
  const parsed = z.string().trim().safeParse(motsCles);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({ veille_mots_cles: parsed.data || null })
    .eq("id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/veille");
  return { ok: true };
}

/** Marque une suggestion comme ignorée. */
export async function ignorerSuggestionAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("veille_suggestions")
    .update({ statut: "ignoree" })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/veille");
  return { ok: true };
}

/** Retient une suggestion : crée une fiche de veille à analyser et marque la suggestion retenue. */
export async function retenirSuggestionAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();

  const { data: sugg } = await supabase
    .from("veille_suggestions")
    .select("titre, ref, domaine, date_texte")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (!sugg) return { ok: false, error: "Suggestion introuvable." };

  const domaine = (
    ["travail", "qualite", "environnement", "securite", "rgpd", "autre"].includes(
      sugg.domaine ?? "",
    )
      ? sugg.domaine
      : "autre"
  ) as "travail" | "qualite" | "environnement" | "securite" | "rgpd" | "autre";

  const { error: insErr } = await supabase.from("veille_reglementaire").insert({
    tenant_id: ctx.effectiveTenantId,
    intitule: sugg.titre,
    reference: sugg.ref,
    domaine,
    date_publication: sugg.date_texte,
    statut: "a_analyser",
    created_by: ctx.userId,
  });
  if (insErr) return { ok: false, error: insErr.message };

  const { error: updErr } = await supabase
    .from("veille_suggestions")
    .update({ statut: "retenue" })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath("/veille");
  return { ok: true };
}
