"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext, IS_STAGING } from "@/lib/tenant-context";

/**
 * Aide au TEST (staging uniquement) : crée deux fiches utilisateurs « placeholder »
 * dans le tenant actif - un Manager flowise et un Dirigeant flowise - qui servent
 * uniquement de signataires distincts. Couplé à l'identité simulée
 * (cf. {@link getTenantContext}), cela permet à un admin de dérouler tout seul un
 * circuit rédacteur → vérificateur → approbateur (et de tester les signatures)
 * sans jamais changer de compte ni se connecter à ces comptes.
 *
 * Jamais exposé en production (garde `IS_STAGING`). Les comptes ont un mot de
 * passe aléatoire et ne sont pas destinés à la connexion.
 */
const PERSONAS = [
  { role: "manager" as const, fullName: "Manager flowise", slug: "manager-flowise" },
  { role: "dirigeant" as const, fullName: "Dirigeant flowise", slug: "dirigeant-flowise" },
];

export async function creerIdentitesTestAction(): Promise<ActionResult> {
  if (!IS_STAGING) {
    return { ok: false, error: "Disponible uniquement sur l'environnement de test (staging)." };
  }
  const ctx = await getTenantContext();
  if (!ctx.realIsAdmin) {
    return { ok: false, error: "Réservé à l'administrateur Flowise." };
  }
  if (!ctx.effectiveTenantId) {
    return { ok: false, error: "Sélectionnez d'abord un client (tenant actif)." };
  }
  const tid = ctx.effectiveTenantId;
  const admin = createAdminClient();

  for (const persona of PERSONAS) {
    // E-mail propre au tenant (alias « + ») : évite tout conflit d'unicité si
    // plusieurs tenants ont leurs propres identités de test.
    const email = `${persona.slug}+${tid}@flowise.fr`;

    // Déjà créé pour ce tenant ? On ne duplique pas.
    const { data: existant } = await admin
      .from("profiles")
      .select("id")
      .eq("tenant_id", tid)
      .eq("email", email)
      .maybeSingle();
    if (existant) continue;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: persona.fullName },
    });
    if (createError || !created?.user) {
      return {
        ok: false,
        error: `Création de « ${persona.fullName} » impossible : ${createError?.message ?? "inconnue"}`,
      };
    }

    // Le trigger handle_new_user a créé le profil (id, email, full_name) ; on le
    // rattache au tenant avec le bon rôle.
    const { error: updateError } = await admin
      .from("profiles")
      .update({ tenant_id: tid, role: persona.role, full_name: persona.fullName })
      .eq("id", created.user.id);
    if (updateError) {
      return {
        ok: false,
        error: `Rattachement de « ${persona.fullName} » : ${updateError.message}`,
      };
    }
  }

  revalidatePath("/utilisateurs");
  return { ok: true };
}
