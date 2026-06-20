"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  token: z.string().uuid(),
  client: z.string().trim().max(200).optional(),
  noteRecommandation: z.coerce.number().int().min(0).max(10),
  noteSatisfaction: z.coerce.number().min(0).max(10).optional(),
  commentaire: z.string().trim().max(2000).optional(),
});

/** Soumission publique d'une réponse de satisfaction (sans authentification). */
export async function submitEnquetePubliqueAction(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Réponse invalide." };
  }
  const d = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("survey_token", d.token)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Questionnaire introuvable." };

  const { error } = await admin.from("enquetes_satisfaction").insert({
    tenant_id: tenant.id,
    client: d.client ?? null,
    note_recommandation: d.noteRecommandation,
    note_satisfaction: d.noteSatisfaction ?? null,
    commentaire: d.commentaire ?? null,
    est_reclamation: d.noteRecommandation <= 6,
    source: "Questionnaire en ligne",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
