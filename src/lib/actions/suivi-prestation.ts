"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  token: z.string().uuid(),
  consultant: z.string().trim().min(1, "Consultant requis."),
  client: z.string().trim().min(1, "Client requis."),
  mission: z.string().trim().min(1, "Mission requise."),
  manager: z.string().trim().min(1, "Manager requis."),
  dateSuivi: z.string().min(1, "Date du suivi requise."),
  perimetreEvolue: z.enum(["Oui", "Non"]),
  satisfactionGlobale: z.coerce.number().int().min(1).max(5),
  nps: z.coerce.number().int().min(0).max(10),
  nouvelleDateSuivi: z.string().min(1, "Nouvelle date de suivi requise."),
  attestation: z.literal(true, { message: "L'attestation sur l'honneur est requise." }),
  nomRepresentant: z.string().trim().min(1, "Nom du représentant requis."),
  mailRepresentant: z.string().trim().email("E-mail du représentant invalide."),
  // Le reste du formulaire est conservé tel quel.
  reponses: z.record(z.string(), z.unknown()),
});

/** Soumission publique d'un suivi de prestation client (BM, sans authentification). */
export async function submitSuiviPrestationAction(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const d = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("survey_token", d.token)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Questionnaire introuvable." };

  const estReclamation = d.nps <= 6 || d.satisfactionGlobale <= 2;

  const { error } = await admin.from("suivis_prestation").insert({
    tenant_id: tenant.id,
    consultant: d.consultant,
    client: d.client,
    mission: d.mission,
    manager: d.manager,
    date_suivi: d.dateSuivi,
    satisfaction_globale: d.satisfactionGlobale,
    nps: d.nps,
    est_reclamation: estReclamation,
    nouvelle_date_suivi: d.nouvelleDateSuivi,
    reponses: d.reponses as unknown as Json,
  });
  if (error) return { ok: false, error: error.message };

  // Alimente aussi le module Satisfaction (NPS global) — note /5 ramenée sur /10.
  await admin.from("enquetes_satisfaction").insert({
    tenant_id: tenant.id,
    client: d.client,
    date_reponse: d.dateSuivi,
    note_recommandation: d.nps,
    note_satisfaction: d.satisfactionGlobale * 2,
    commentaire:
      typeof d.reponses.commentaire_satisfaction === "string"
        ? (d.reponses.commentaire_satisfaction as string)
        : null,
    est_reclamation: estReclamation,
    source: "Suivi de prestation client",
  });

  return { ok: true };
}
