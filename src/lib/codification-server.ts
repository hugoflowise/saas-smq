import "server-only";
import { chronoFromReference, type FamilleDoc, formatReference } from "./codification";
import { createClient } from "./supabase/server";

/**
 * Calcule la prochaine référence libre pour un couple (famille, processus) chez
 * un client. Scanne **toutes** les sources de codes existantes du tenant pour
 * garantir l'unicité et **préserver** les codes déjà saisis (on repart du plus
 * haut numéro déjà attribué + 1). Renvoie `null` si le processus n'a pas de
 * trigramme (impossible de former le segment du milieu).
 */
export async function prochaineReference(
  tenantId: string,
  famille: FamilleDoc,
  processusCode: string | null | undefined,
): Promise<string | null> {
  const code = processusCode?.trim();
  if (!code) return null;

  const supabase = await createClient();
  const [pol, procs, docs, fiches, tenant] = await Promise.all([
    supabase.from("politique_qualite").select("code").eq("tenant_id", tenantId),
    supabase.from("procedures").select("code").eq("tenant_id", tenantId).is("deleted_at", null),
    supabase
      .from("documents_maitrise")
      .select("code")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("processus")
      .select("fiche_reference")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase.from("tenants").select("cartographie_reference").eq("id", tenantId).maybeSingle(),
  ]);

  const codes = [
    ...(pol.data ?? []).map((r) => r.code),
    ...(procs.data ?? []).map((r) => r.code),
    ...(docs.data ?? []).map((r) => r.code),
    ...(fiches.data ?? []).map((r) => r.fiche_reference),
    tenant.data?.cartographie_reference ?? null,
  ].filter((c): c is string => Boolean(c));

  let maxChrono = 0;
  for (const c of codes) {
    const n = chronoFromReference(c, famille, code);
    if (n !== null && n > maxChrono) maxChrono = n;
  }
  return formatReference(famille, code, maxChrono + 1);
}
