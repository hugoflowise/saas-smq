"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { ingestSuiviConsultant } from "@/lib/suivi-ingest";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  token: z.string().uuid(),
  reponses: z.record(z.string(), z.unknown()),
  modeleVersion: z.number().int().nullable().optional(),
});

/** Soumission publique d'un suivi consultant (terrain, sans authentification). */
export async function submitSuiviConsultantAction(input: unknown): Promise<ActionResult> {
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

  const result = await ingestSuiviConsultant(admin, tenant.id, r, modeleVersion ?? null);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
