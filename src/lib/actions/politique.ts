"use server";

import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Transitions de statut autorisées pour un document maîtrisé. */
const TRANSITIONS: Record<string, string[]> = {
  brouillon: ["en_revue"],
  en_revue: ["brouillon", "approuvee"],
  approuvee: ["en_revue", "publiee"],
  publiee: ["brouillon"], // démarre une nouvelle version
  archivee: [],
};

export async function savePolitiqueContenuAction(contenu: Json): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("politique_qualite")
    .select("id, statut")
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  if (existing && existing.statut !== "brouillon") {
    return { ok: false, error: "La politique n'est modifiable qu'en brouillon." };
  }

  const { error } = existing
    ? await supabase
        .from("politique_qualite")
        .update({ contenu, updated_by: ctx.userId })
        .eq("id", existing.id)
    : await supabase.from("politique_qualite").insert({
        tenant_id: ctx.effectiveTenantId,
        contenu,
        created_by: ctx.userId,
      });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/strategie/politique");
  return { ok: true };
}

export async function transitionPolitiqueStatutAction(target: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("politique_qualite")
    .select("id, statut")
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Rédigez et enregistrez d'abord la politique." };

  if (!TRANSITIONS[existing.statut]?.includes(target)) {
    return { ok: false, error: "Transition de statut non autorisée." };
  }

  const { error } = await supabase
    .from("politique_qualite")
    .update({
      statut: target as "brouillon" | "en_revue" | "approuvee" | "publiee" | "archivee",
      updated_by: ctx.userId,
    })
    .eq("id", existing.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/strategie/politique");
  return { ok: true };
}
