"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };
type PolitiqueUpdate = Database["public"]["Tables"]["politique_qualite"]["Update"];

/** Transitions de statut autorisées (hors publication, gérée à part). */
const TRANSITIONS: Record<string, string[]> = {
  brouillon: ["en_revue"],
  en_revue: ["brouillon", "approuvee"],
  approuvee: ["en_revue"],
  publiee: ["brouillon"], // démarre une nouvelle version
  archivee: [],
};

async function loadPolitique(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("politique_qualite")
    .select("id, statut, contenu, approved_by, approved_at, signature_data")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return { supabase, politique: data };
}

export async function savePolitiqueContenuAction(contenu: Json): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);

  if (politique && politique.statut !== "brouillon") {
    return { ok: false, error: "La politique n'est modifiable qu'en brouillon." };
  }

  const { error } = politique
    ? await supabase
        .from("politique_qualite")
        .update({ contenu, updated_by: ctx.userId })
        .eq("id", politique.id)
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

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);
  if (!politique) return { ok: false, error: "Rédigez et enregistrez d'abord la politique." };

  if (!TRANSITIONS[politique.statut]?.includes(target)) {
    return { ok: false, error: "Transition de statut non autorisée." };
  }

  const update: PolitiqueUpdate = {
    statut: target as PolitiqueUpdate["statut"],
    updated_by: ctx.userId,
  };

  // Approbation = signature électronique (CDC §8.3)
  if (target === "approuvee") {
    const h = await headers();
    update.approved_by = ctx.userId;
    update.approved_at = new Date().toISOString();
    update.signature_data = {
      user_id: ctx.userId,
      signed_at: new Date().toISOString(),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: h.get("user-agent") ?? null,
    } satisfies Json;
  }

  const { error } = await supabase.from("politique_qualite").update(update).eq("id", politique.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/politique");
  return { ok: true };
}

/** Publication : crée un snapshot de version figé puis passe en "publiee". */
export async function publishPolitiqueAction(): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);
  if (!politique) return { ok: false, error: "Politique introuvable." };
  if (politique.statut !== "approuvee") {
    return { ok: false, error: "La politique doit être approuvée avant publication." };
  }

  const { count } = await supabase
    .from("politique_qualite_versions")
    .select("id", { count: "exact", head: true })
    .eq("politique_id", politique.id);
  const version = `v${(count ?? 0) + 1}`;

  const { data: created, error: versionError } = await supabase
    .from("politique_qualite_versions")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      politique_id: politique.id,
      version,
      contenu_snapshot: politique.contenu,
      approved_by: politique.approved_by,
      approved_at: politique.approved_at,
      signature_data: politique.signature_data,
    })
    .select("id")
    .single();

  if (versionError || !created) {
    return { ok: false, error: `Création de la version impossible : ${versionError?.message}` };
  }

  const { error } = await supabase
    .from("politique_qualite")
    .update({ statut: "publiee", version_actuelle_id: created.id, updated_by: ctx.userId })
    .eq("id", politique.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/politique");
  return { ok: true };
}
