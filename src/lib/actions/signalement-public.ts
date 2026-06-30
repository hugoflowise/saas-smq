"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  token: z.string().uuid(),
  type: z.enum(["reclamation", "dysfonctionnement", "incident", "accident"]).optional(),
  objet: z.string().trim().min(3, "Merci de préciser l'objet en quelques mots.").max(200),
  description: z.string().trim().max(4000).optional(),
  gravite: z.enum(["mineure", "majeure", "critique"]).optional(),
  // Identité du déclarant : obligatoire (rôle + nom + e-mail) pour pouvoir
  // tracer et recontacter.
  declarantRole: z.enum(["business_manager", "consultant", "autre"], {
    message: "Indiquez si vous êtes business manager ou consultant.",
  }),
  declarantNom: z.string().trim().min(2, "Indiquez votre nom."),
  declarantEmail: z.string().trim().max(200).email("Adresse e-mail invalide."),
  // Honeypot anti-spam : champ masqué qui doit rester vide.
  website: z.string().max(0).optional().or(z.literal("")),
});

/**
 * Dépôt public d'une remontée (réclamation / dysfonctionnement / incident /
 * accident) sans authentification, via le `survey_token` du tenant (lien ou QR).
 * Insère dans `reclamations` au statut « reçue », canal « enquête ».
 */
export async function submitSignalementPublicAction(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const d = parsed.data;

  // Honeypot rempli : robot probable. On simule un succès sans rien enregistrer.
  if (d.website) return { ok: true };

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("survey_token", d.token)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Formulaire introuvable ou expiré." };

  const { error } = await admin.from("reclamations").insert({
    tenant_id: tenant.id,
    type: d.type ?? "reclamation",
    objet: d.objet,
    description: d.description ?? null,
    gravite: d.gravite ?? "mineure",
    canal: "enquete",
    statut: "recue",
    client: d.declarantNom,
    declarant_nom: d.declarantNom,
    declarant_email: d.declarantEmail,
    declarant_role: d.declarantRole,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
