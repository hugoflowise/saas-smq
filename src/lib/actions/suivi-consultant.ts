"use server";

import { z } from "zod";
import { ALERTE_KEYS } from "@/lib/suivi-consultant";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  token: z.string().uuid(),
  reponses: z.record(z.string(), z.unknown()),
});

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const ouiNon = (v: unknown): boolean | null => (v === "Oui" ? true : v === "Non" ? false : null);

/** Soumission publique d'un suivi consultant (terrain, sans authentification). */
export async function submitSuiviConsultantAction(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { token, reponses: r } = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("survey_token", token)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Questionnaire introuvable." };

  const alerte = ALERTE_KEYS.some((k) => r[k] === "Oui");

  const { error } = await admin.from("suivis_consultant").insert({
    tenant_id: tenant.id,
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
    reponses: r as unknown as Json,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
