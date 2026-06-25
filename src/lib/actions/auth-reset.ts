"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { callbackLinkFromProperties } from "@/lib/auth-links";
import { resetEmailHtml, sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.string().trim().toLowerCase().email();

/**
 * Demande de réinitialisation de mot de passe (page de connexion).
 * Renvoie toujours un succès, que le compte existe ou non, pour ne pas
 * révéler les e-mails enregistrés. L'e-mail de réinitialisation (lien
 * sécurisé) est envoyé via Resend, comme l'invitation.
 */
export async function demanderResetMotDePasseAction(email: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "Adresse e-mail invalide." };

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const admin = createAdminClient();

  // generateLink échoue si le compte n'existe pas : on ignore l'erreur pour
  // ne pas divulguer l'existence du compte.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data,
    options: { redirectTo: `${base}/auth/callback?next=/bienvenue` },
  });

  const lien = callbackLinkFromProperties(base, data?.properties, "/bienvenue");
  if (!error && lien) {
    await sendEmail({
      to: parsed.data,
      subject: "Réinitialisation de votre mot de passe",
      html: resetEmailHtml({ actionLink: lien }),
    });
  }

  return { ok: true };
}
