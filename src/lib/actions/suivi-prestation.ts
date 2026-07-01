"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const schema = z.object({
  token: z.string().uuid(),
  reponses: z.record(z.string(), z.unknown()),
  modeleVersion: z.number().int().nullable().optional(),
  attestation: z.literal(true, { message: "L'attestation sur l'honneur est requise." }),
});

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/**
 * Soumission publique d'un suivi de prestation client (BM, sans authentification).
 * Les colonnes dénormalisées de `suivis_prestation` (consultant, client, etc.) et
 * la logique de réclamation sont extraites depuis `reponses`, dont les clés sont
 * figées par les champs socle (`verrou`) du modèle par défaut.
 */
export async function submitSuiviPrestationAction(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { token, reponses: r, modeleVersion } = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("survey_token", token)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Questionnaire introuvable." };

  const satisfactionGlobale = num(r.satisfaction_globale);
  const nps = num(r.nps);
  // `date_suivi` est un champ socle requis : présent en pratique, sécurisé ici.
  const dateSuivi = str(r.date_suivi) ?? "";

  // Réclamation : recommandation faible (≤ 6) ou satisfaction basse (≤ 2).
  const estReclamation =
    (nps != null && nps <= 6) || (satisfactionGlobale != null && satisfactionGlobale <= 2);

  const { error } = await admin.from("suivis_prestation").insert({
    tenant_id: tenant.id,
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
    reponses: r as unknown as Json,
  });
  if (error) return { ok: false, error: error.message };

  // Alimente aussi le module Satisfaction (NPS global) · note /5 ramenée sur /10.
  await admin.from("enquetes_satisfaction").insert({
    tenant_id: tenant.id,
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

  return { ok: true };
}
