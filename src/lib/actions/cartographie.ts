"use server";

import { revalidatePath } from "next/cache";
import type { CartographieSnapshot } from "@/app/(tenant)/processus/cartographie-snapshot";
import type { ActionResult } from "@/lib/actions/types";
import { canWrite } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionLettre } from "@/lib/versions";

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
    supabase.from("tenants").select("couleur_charte").eq("id", tid).maybeSingle(),
  ]);

  if (!processus || processus.length === 0) {
    return { ok: false, error: "Aucun processus à figer dans la cartographie." };
  }

  const snapshot: CartographieSnapshot = {
    charte: tenant?.couleur_charte ?? null,
    processus: processus.map((p) => ({
      nom: p.nom,
      type: p.type,
      description: p.description,
    })),
  };

  // Version = lettre suivante d'après le nombre de versions déjà figées.
  const { count } = await supabase
    .from("cartographie_versions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);
  const version = versionLettre(count ?? 0);

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
