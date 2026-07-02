import { ACTION_ORIGINE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

/** Colonnes minimales d'une action nécessaires pour résoudre sa source. */
export type ActionSourceRow = {
  id: string;
  origine: string | null;
  objectif_id: string | null;
  revue_id: string | null;
  contexte_item_id: string | null;
  contexte_item_label: string | null;
};

/** Origine résolue d'une action : libellé + lien cliquable vers la source réelle. */
export type ActionSource = {
  /** Libellé de l'origine (ex. « Non-conformité »). */
  origineLabel: string;
  /** Lien vers l'entité source (ex. /nc/<id>), ou null si pas de source liée. */
  href: string | null;
  /** Libellé court de la source (ex. « NC-2026-003 »), ou null. */
  sourceLabel: string | null;
};

function libelleOrigine(origine: string | null): string {
  if (!origine) return "Manuelle";
  return ACTION_ORIGINE_LABELS[origine as keyof typeof ACTION_ORIGINE_LABELS] ?? origine;
}

/**
 * Traçabilité des actions : pour un lot d'actions, résout l'origine et le lien
 * effectif vers la source (NC, remontée, R&O, audit, réunion, revue, objectif,
 * SWOT/PESTEL). Agrège les 3 mécanismes de lien du modèle :
 *  - FK directe sur `actions` (objectif_id, revue_id, contexte_item_id) ;
 *  - tables pivot (nc_actions, ro_actions, audit_actions, reunion_actions) ;
 *  - FK inverse (reclamations.action_id).
 * Une action est en général issue d'une seule source ; en cas de multiples, on
 * applique un ordre de priorité stable.
 */
export async function resolveActionSources(
  tenantId: string,
  rows: ActionSourceRow[],
): Promise<Map<string, ActionSource>> {
  const result = new Map<string, ActionSource>();
  for (const r of rows) {
    result.set(r.id, { origineLabel: libelleOrigine(r.origine), href: null, sourceLabel: null });
  }
  if (rows.length === 0) return result;

  const supabase = await createClient();
  const actionIds = rows.map((r) => r.id);
  const objectifIds = [...new Set(rows.map((r) => r.objectif_id).filter(Boolean))] as string[];

  // Requêtes de résolution (en parallèle). Les pivots renvoient l'id de la source,
  // résolu ensuite en libellé par une seconde passe.
  const [
    { data: objectifs },
    { data: ncLiens },
    { data: reclams },
    { data: roLiens },
    { data: auditLiens },
    { data: reunionLiens },
  ] = await Promise.all([
    objectifIds.length
      ? supabase.from("objectifs_qualite").select("id, intitule").in("id", objectifIds)
      : Promise.resolve({ data: [] as { id: string; intitule: string }[] }),
    supabase.from("nc_actions").select("action_id, nc_id").in("action_id", actionIds),
    supabase
      .from("reclamations")
      .select("id, objet, action_id")
      .eq("tenant_id", tenantId)
      .in("action_id", actionIds),
    supabase.from("ro_actions").select("action_id, ro_id").in("action_id", actionIds),
    supabase.from("audit_actions").select("action_id, audit_id").in("action_id", actionIds),
    supabase.from("reunion_actions").select("action_id, reunion_id").in("action_id", actionIds),
  ]);

  const objIntitule = new Map((objectifs ?? []).map((o) => [o.id, o.intitule]));

  // Seconde passe : libellés des entités pointées par les pivots.
  const ncIds = [...new Set((ncLiens ?? []).map((l) => l.nc_id))];
  const roIds = [...new Set((roLiens ?? []).map((l) => l.ro_id))];
  const auditIds = [...new Set((auditLiens ?? []).map((l) => l.audit_id))];
  const reunionIds = [...new Set((reunionLiens ?? []).map((l) => l.reunion_id))];
  const [{ data: ncs }, { data: ros }, { data: audits }, { data: reunions }] = await Promise.all([
    ncIds.length
      ? supabase.from("non_conformites").select("id, reference").in("id", ncIds)
      : Promise.resolve({ data: [] as { id: string; reference: string }[] }),
    roIds.length
      ? supabase.from("risques_opportunites").select("id, intitule").in("id", roIds)
      : Promise.resolve({ data: [] as { id: string; intitule: string }[] }),
    auditIds.length
      ? supabase.from("audits_internes").select("id, reference").in("id", auditIds)
      : Promise.resolve({ data: [] as { id: string; reference: string }[] }),
    reunionIds.length
      ? supabase.from("reunions").select("id, titre").in("id", reunionIds)
      : Promise.resolve({ data: [] as { id: string; titre: string }[] }),
  ]);
  const ncRef = new Map((ncs ?? []).map((n) => [n.id, n.reference]));
  const roIntitule = new Map((ros ?? []).map((r) => [r.id, r.intitule]));
  const auditRef = new Map((audits ?? []).map((a) => [a.id, a.reference]));
  const reunionTitre = new Map((reunions ?? []).map((r) => [r.id, r.titre]));

  // action_id -> source (via pivots / FK inverse).
  const ncByAction = new Map<string, string>();
  for (const l of ncLiens ?? [])
    if (!ncByAction.has(l.action_id)) ncByAction.set(l.action_id, l.nc_id);
  const recByAction = new Map<string, { id: string; objet: string | null }>();
  for (const r of reclams ?? [])
    if (r.action_id) recByAction.set(r.action_id, { id: r.id, objet: r.objet });
  const roByAction = new Map<string, string>();
  for (const l of roLiens ?? [])
    if (!roByAction.has(l.action_id)) roByAction.set(l.action_id, l.ro_id);
  const auditByAction = new Map<string, string>();
  for (const l of auditLiens ?? [])
    if (!auditByAction.has(l.action_id)) auditByAction.set(l.action_id, l.audit_id);
  const reunionByAction = new Map<string, string>();
  for (const l of reunionLiens ?? [])
    if (!reunionByAction.has(l.action_id)) reunionByAction.set(l.action_id, l.reunion_id);

  for (const r of rows) {
    const base = result.get(r.id);
    if (!base) continue;
    let href: string | null = null;
    let sourceLabel: string | null = null;

    // Ordre de priorité : FK directes d'abord, puis pivots / FK inverse.
    if (r.objectif_id) {
      href = "/strategie/objectifs";
      sourceLabel = objIntitule.get(r.objectif_id) ?? "Objectif qualité";
    } else if (r.revue_id) {
      href = `/revues/direction/${r.revue_id}`;
      sourceLabel = "Revue de direction";
    } else if (r.contexte_item_id) {
      href = "/strategie/contexte";
      sourceLabel = r.contexte_item_label ?? "Point SWOT / PESTEL";
    } else if (ncByAction.has(r.id)) {
      const id = ncByAction.get(r.id) as string;
      href = `/nc/${id}`;
      sourceLabel = ncRef.get(id) ?? "Non-conformité";
    } else if (recByAction.has(r.id)) {
      const rec = recByAction.get(r.id) as { id: string; objet: string | null };
      href = `/reclamations/${rec.id}`;
      sourceLabel = rec.objet ?? "Remontée";
    } else if (roByAction.has(r.id)) {
      const id = roByAction.get(r.id) as string;
      href = `/risques/${id}`;
      sourceLabel = roIntitule.get(id) ?? "Risque / opportunité";
    } else if (auditByAction.has(r.id)) {
      const id = auditByAction.get(r.id) as string;
      href = `/audits/${id}`;
      sourceLabel = auditRef.get(id) ?? "Audit";
    } else if (reunionByAction.has(r.id)) {
      const id = reunionByAction.get(r.id) as string;
      href = `/reunions/${id}`;
      sourceLabel = reunionTitre.get(id) ?? "Réunion";
    }

    base.href = href;
    base.sourceLabel = sourceLabel;
  }

  return result;
}
