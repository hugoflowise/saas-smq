import "server-only";
import {
  chronoFromReference,
  type FamilleDoc,
  formatReference,
  TYPE_MAITRISE_TO_FAMILLE,
} from "./codification";
import { createClient } from "./supabase/server";

type DbClient = Awaited<ReturnType<typeof createClient>>;

/** Rassemble tous les codes documentaires déjà attribués chez un client (toutes sources). */
async function tousLesCodes(supabase: DbClient, tenantId: string): Promise<string[]> {
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

  return [
    ...(pol.data ?? []).map((r) => r.code),
    ...(procs.data ?? []).map((r) => r.code),
    ...(docs.data ?? []).map((r) => r.code),
    ...(fiches.data ?? []).map((r) => r.fiche_reference),
    tenant.data?.cartographie_reference ?? null,
  ].filter((c): c is string => Boolean(c));
}

/** Plus haut numéro chronologique déjà attribué pour un couple (famille, trigramme). */
function maxChrono(codes: string[], famille: FamilleDoc, trigramme: string): number {
  let max = 0;
  for (const c of codes) {
    const n = chronoFromReference(c, famille, trigramme);
    if (n !== null && n > max) max = n;
  }
  return max;
}

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
  const codes = await tousLesCodes(supabase, tenantId);
  return formatReference(famille, code, maxChrono(codes, famille, code) + 1);
}

/**
 * Attribue une référence aux documents d'un processus qui n'en ont pas encore
 * (procédures + registre manuel codifiable). Appelé après la saisie/correction
 * du trigramme : un document créé avant que le trigramme existe reçoit alors
 * son code. Préserve les codes déjà présents. Renvoie le nombre de codes posés.
 */
export async function attribuerCodesManquants(
  tenantId: string,
  processusId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: proc } = await supabase
    .from("processus")
    .select("code, fiche_reference")
    .eq("id", processusId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const trimmed = proc?.code?.trim();
  if (!trimmed) return 0;
  const trigramme: string = trimmed;

  // Compteur courant par famille, incrémenté localement au fil des attributions.
  const codes = await tousLesCodes(supabase, tenantId);
  const compteur = new Map<FamilleDoc, number>();
  function prochain(famille: FamilleDoc): string {
    const base = compteur.get(famille) ?? maxChrono(codes, famille, trigramme);
    const n = base + 1;
    compteur.set(famille, n);
    return formatReference(famille, trigramme, n);
  }

  let poses = 0;

  // Fiche d'identité du processus (famille DG) : assignée en premier pour
  // obtenir le plus petit numéro DG (typiquement DG_{trigramme}_001).
  if (!proc?.fiche_reference?.trim()) {
    await supabase
      .from("processus")
      .update({ fiche_reference: prochain("DG") })
      .eq("id", processusId)
      .eq("tenant_id", tenantId);
    poses++;
  }

  const { data: procsSansCode } = await supabase
    .from("procedures")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("processus_id", processusId)
    .is("deleted_at", null)
    .is("code", null)
    .order("created_at", { ascending: true });
  for (const p of procsSansCode ?? []) {
    await supabase
      .from("procedures")
      .update({ code: prochain("PR") })
      .eq("id", p.id);
    poses++;
  }

  const { data: docsSansCode } = await supabase
    .from("documents_maitrise")
    .select("id, type")
    .eq("tenant_id", tenantId)
    .eq("processus_id", processusId)
    .is("deleted_at", null)
    .is("code", null)
    .order("created_at", { ascending: true });
  for (const d of docsSansCode ?? []) {
    const famille = TYPE_MAITRISE_TO_FAMILLE[d.type];
    if (!famille) continue;
    await supabase
      .from("documents_maitrise")
      .update({ code: prochain(famille) })
      .eq("id", d.id);
    poses++;
  }

  return poses;
}
