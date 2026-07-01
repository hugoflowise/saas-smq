import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ALERTE_KEYS } from "@/lib/suivi-consultant";
import type { Database, Json } from "@/lib/supabase/database.types";

/**
 * Insertion des suivis (consultant / prestation) à partir de leurs `reponses`.
 *
 * Source unique partagée par les deux chemins de soumission :
 * - formulaires publics en ligne (server actions `submit*Action`) ;
 * - synchronisation des fichiers hors-ligne (route `/api/hors-ligne/[type]`).
 *
 * Les colonnes dénormalisées et la logique métier (alerte, réclamation) sont
 * extraites ici pour ne jamais diverger entre les deux chemins.
 *
 * `idempotencyKey` (hors-ligne) rend la réémission sans effet : en cas de
 * conflit sur la clé, l'insertion est ignorée. `inserted` vaut `false` dans ce
 * cas, ce qui évite de dupliquer les effets de bord (ex. enquête satisfaction).
 */

type Admin = SupabaseClient<Database>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const ouiNon = (v: unknown): boolean | null => (v === "Oui" ? true : v === "Non" ? false : null);

export type IngestResult = { ok: true; inserted: boolean } | { ok: false; error: string };

export async function ingestSuiviConsultant(
  admin: Admin,
  tenantId: string,
  r: Record<string, unknown>,
  modeleVersion: number | null,
  idempotencyKey?: string | null,
): Promise<IngestResult> {
  const alerte = ALERTE_KEYS.some((k) => r[k] === "Oui");

  const row = {
    tenant_id: tenantId,
    nom: str(r.nom),
    email: str(r.email),
    client: str(r.client),
    poste: str(r.poste),
    site_intervention: str(r.site_intervention),
    satisfaction_globale: num(r.satisfaction_globale),
    note_qualite_suivi_manager: num(r.note_qualite_suivi_manager),
    nps: num(r.nps),
    coherence_odm: ouiNon(r.coherence_odm),
    secteur_nucleaire: ouiNon(r.secteur_nucleaire),
    besoin_accompagnement: ouiNon(r.besoin_accompagnement),
    habilitations: ouiNon(r.habilitations),
    alerte,
    modele_version: modeleVersion ?? null,
    idempotency_key: idempotencyKey ?? null,
    reponses: r as unknown as Json,
  };

  if (idempotencyKey) {
    const { data, error } = await admin
      .from("suivis_consultant")
      .upsert(row, { onConflict: "idempotency_key", ignoreDuplicates: true })
      .select("id");
    if (error) return { ok: false, error: error.message };
    return { ok: true, inserted: (data?.length ?? 0) > 0 };
  }

  const { error } = await admin.from("suivis_consultant").insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true, inserted: true };
}

export async function ingestSuiviPrestation(
  admin: Admin,
  tenantId: string,
  r: Record<string, unknown>,
  modeleVersion: number | null,
  idempotencyKey?: string | null,
): Promise<IngestResult> {
  const satisfactionGlobale = num(r.satisfaction_globale);
  const nps = num(r.nps);
  const dateSuivi = str(r.date_suivi) ?? "";
  // Réclamation : recommandation faible (≤ 6) ou satisfaction basse (≤ 2).
  const estReclamation =
    (nps != null && nps <= 6) || (satisfactionGlobale != null && satisfactionGlobale <= 2);

  const row = {
    tenant_id: tenantId,
    consultant: str(r.consultant),
    client: str(r.client),
    mission: str(r.mission),
    manager: str(r.manager),
    date_suivi: dateSuivi || null,
    satisfaction_globale: satisfactionGlobale,
    nps,
    est_reclamation: estReclamation,
    nouvelle_date_suivi: str(r.nouvelle_date_suivi),
    modele_version: modeleVersion ?? null,
    idempotency_key: idempotencyKey ?? null,
    reponses: r as unknown as Json,
  };

  let inserted = true;
  if (idempotencyKey) {
    const { data, error } = await admin
      .from("suivis_prestation")
      .upsert(row, { onConflict: "idempotency_key", ignoreDuplicates: true })
      .select("id");
    if (error) return { ok: false, error: error.message };
    inserted = (data?.length ?? 0) > 0;
  } else {
    const { error } = await admin.from("suivis_prestation").insert(row);
    if (error) return { ok: false, error: error.message };
  }

  // Effet de bord (module Satisfaction) seulement si le suivi a bien été inséré.
  if (inserted) {
    await admin.from("enquetes_satisfaction").insert({
      tenant_id: tenantId,
      client: str(r.client),
      date_reponse: dateSuivi,
      note_recommandation: nps,
      note_satisfaction: satisfactionGlobale != null ? satisfactionGlobale * 2 : null,
      commentaire:
        typeof r.commentaire_satisfaction === "string"
          ? (r.commentaire_satisfaction as string)
          : null,
      est_reclamation: estReclamation,
      source: "Suivi de prestation client",
    });
  }

  return { ok: true, inserted };
}
