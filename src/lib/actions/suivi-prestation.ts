"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { ingestSuiviPrestation } from "@/lib/suivi-ingest";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  token: z.string().uuid(),
  reponses: z.record(z.string(), z.unknown()),
  modeleVersion: z.number().int().nullable().optional(),
  attestation: z.literal(true, { message: "L'attestation sur l'honneur est requise." }),
});

/**
 * Soumission publique d'un suivi de prestation client (BM, sans authentification).
 * Les colonnes dénormalisées de `suivis_prestation` et la logique de réclamation
 * sont extraites depuis `reponses` par `ingestSuiviPrestation` (source unique
 * partagée avec la synchronisation hors-ligne).
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

  const result = await ingestSuiviPrestation(admin, tenant.id, r, modeleVersion ?? null);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
