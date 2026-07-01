import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { objectifProgress } from "@/lib/objectifs";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Mesure d'un objectif à partir de ses indicateurs liés (source unique).
 *
 * Un objectif n'a plus de valeur/cible propres : il est mesuré par ses
 * indicateurs (liaison N–N `objectif_indicateurs`), chacun portant sa cible et
 * son sens définis dans Indicateurs. Ce helper centralise le chargement + le
 * calcul pour que la progression soit identique partout (page Objectifs,
 * dashboard, fiche processus, revue de direction).
 */

export type IndicateurMesure = {
  id: string;
  nom: string;
  unite: string | null;
  cible: number | null;
  sens: string | null;
  derniere: number | null;
  pct: number | null;
  atteint: boolean;
};

export type ObjectifMesure = {
  indicateurs: IndicateurMesure[];
  /** Progression globale = moyenne des indicateurs effectivement mesurés. */
  pctMoyen: number | null;
  /** Vrai si l'objectif a ≥ 1 indicateur ET que tous atteignent leur cible. */
  indicateursAtteints: boolean;
};

const VIDE: ObjectifMesure = { indicateurs: [], pctMoyen: null, indicateursAtteints: false };

export async function chargerMesuresObjectifs(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  objectifIds: string[],
): Promise<Map<string, ObjectifMesure>> {
  const result = new Map<string, ObjectifMesure>();
  if (!objectifIds.length) return result;

  const { data: liens } = await supabase
    .from("objectif_indicateurs")
    .select("objectif_id, indicateur_id")
    .eq("tenant_id", tenantId)
    .in("objectif_id", objectifIds);

  const indIdsByObj = new Map<string, string[]>();
  for (const l of liens ?? []) {
    const list = indIdsByObj.get(l.objectif_id) ?? [];
    list.push(l.indicateur_id);
    indIdsByObj.set(l.objectif_id, list);
  }

  const indIds = [...new Set((liens ?? []).map((l) => l.indicateur_id))];
  const indById = new Map<
    string,
    { id: string; nom: string; unite: string | null; cible: number | null; sens: string | null }
  >();
  const lastVal = new Map<string, number>();
  if (indIds.length) {
    const [{ data: inds }, { data: vals }] = await Promise.all([
      supabase.from("indicateurs").select("id, nom, unite, cible, sens").in("id", indIds),
      supabase
        .from("indicateurs_valeurs")
        .select("indicateur_id, valeur, date_mesure")
        .in("indicateur_id", indIds)
        .order("date_mesure", { ascending: false }),
    ]);
    for (const i of inds ?? []) indById.set(i.id, i);
    for (const v of vals ?? []) {
      if (!lastVal.has(v.indicateur_id)) lastVal.set(v.indicateur_id, Number(v.valeur));
    }
  }

  for (const objId of objectifIds) {
    const indicateurs: IndicateurMesure[] = (indIdsByObj.get(objId) ?? [])
      .map((id) => indById.get(id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i))
      .map((i) => {
        const derniere = lastVal.get(i.id) ?? null;
        const pct = objectifProgress(derniere, i.cible, i.sens);
        return { ...i, derniere, pct, atteint: pct !== null && pct >= 100 };
      });
    const mesures = indicateurs.filter((i) => i.pct !== null);
    const pctMoyen = mesures.length
      ? Math.round(mesures.reduce((s, i) => s + (i.pct ?? 0), 0) / mesures.length)
      : null;
    result.set(objId, {
      indicateurs,
      pctMoyen,
      indicateursAtteints: indicateurs.length > 0 && indicateurs.every((i) => i.atteint),
    });
  }
  return result;
}

/** Mesure d'un objectif absent de la table (aucun indicateur). */
export function mesureVide(): ObjectifMesure {
  return VIDE;
}
