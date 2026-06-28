"use server";

import { revalidatePath } from "next/cache";
import type { CartographieSnapshot } from "@/app/(tenant)/processus/cartographie-snapshot";
import type { ActionResult } from "@/lib/actions/types";
import { canWrite } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionIndex, versionLettre } from "@/lib/versions";

/** Enregistre la référence documentaire de la cartographie (codification client). */
export async function saveCartographieReferenceAction(code: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ cartographie_reference: code.trim() || null })
    .eq("id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/processus");
  return { ok: true };
}

/**
 * Fige une nouvelle version de la cartographie des processus : instantané des
 * processus actuels (familles incluses) + couleur de charte, avec une version
 * lettrée (A, B, C…) et la date/auteur. La cartographie étant une vue dérivée,
 * il n'y a pas de circuit d'approbation : tout rédacteur peut publier une
 * version (l'auditeur en lecture seule est bloqué).
 */
export async function publishCartographieVersionAction(): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  const tid = ctx.effectiveTenantId;

  const supabase = await createClient();

  const [{ data: processus }, { data: tenant }] = await Promise.all([
    supabase
      .from("processus")
      .select("nom, type, description")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("ordre_affichage", { ascending: true }),
    supabase
      .from("tenants")
      .select("couleur_charte, cartographie_reference")
      .eq("id", tid)
      .maybeSingle(),
  ]);

  if (!processus || processus.length === 0) {
    return { ok: false, error: "Aucun processus à figer dans la cartographie." };
  }

  const snapshot: CartographieSnapshot = {
    charte: tenant?.couleur_charte ?? null,
    reference: tenant?.cartographie_reference ?? null,
    processus: processus.map((p) => ({
      nom: p.nom,
      type: p.type,
      description: p.description,
    })),
  };

  // Version = lettre suivant la plus haute déjà attribuée (et non un compteur) :
  // ainsi une suppression de version ne provoque pas de collision de lettre.
  const { data: existantes } = await supabase
    .from("cartographie_versions")
    .select("version")
    .eq("tenant_id", tid);
  const maxIndex = (existantes ?? []).reduce(
    (max, v) => Math.max(max, versionIndex(v.version)),
    -1,
  );
  const version = versionLettre(maxIndex + 1);

  const { error } = await supabase.from("cartographie_versions").insert({
    tenant_id: tid,
    version,
    snapshot: snapshot as unknown as Json,
    published_by: ctx.userId,
  });
  if (error) {
    return { ok: false, error: `Publication de la version impossible : ${error.message}` };
  }

  revalidatePath("/processus");
  return { ok: true };
}

/**
 * Supprime une version figée de la cartographie (créée par erreur). Suppression
 * définitive : un instantané erroné n'a pas vocation à rester dans l'historique.
 * Les lettres déjà attribuées aux autres versions ne changent pas.
 */
export async function deleteCartographieVersionAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  // `.select()` permet de vérifier qu'une ligne a bien été supprimée : sans
  // policy DELETE, RLS renvoie 0 ligne sans erreur — on le remonte explicitement.
  const { data, error } = await supabase
    .from("cartographie_versions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .select("id");
  if (error) return { ok: false, error: `Suppression impossible : ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: "Suppression refusée (droits ou version introuvable)." };
  }

  revalidatePath("/processus");
  return { ok: true };
}
