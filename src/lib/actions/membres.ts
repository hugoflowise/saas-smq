"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { inviteEmailHtml, sendEmail } from "@/lib/email";
import { canManageUsers, ROLE_MEMBRE_LABELS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";

const roleSchema = z.enum(["dirigeant", "manager", "auditeur"]);

type ManagerContext =
  | { ok: false; error: string }
  | { ok: true; admin: ReturnType<typeof createAdminClient>; tenantId: string; userId: string };

/** Contexte commun : exige un gestionnaire d'utilisateurs (dirigeant ou admin) avec un client actif. */
async function requireManager(): Promise<ManagerContext> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canManageUsers(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  return {
    ok: true,
    admin: createAdminClient(),
    tenantId: ctx.effectiveTenantId,
    userId: ctx.userId,
  };
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail invalide."),
  fullName: z.string().trim().optional(),
  role: roleSchema,
});

/** Invite un collègue : crée le compte, le rattache au client + rôle, envoie l'e-mail. */
export async function inviteMembreAction(input: unknown): Promise<ActionResult> {
  const c = await requireManager();
  if (!c.ok) return { ok: false, error: c.error };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { email, fullName, role } = parsed.data;

  // Déjà membre de ce client ?
  const { data: existant } = await c.admin
    .from("profiles")
    .select("id, tenant_id")
    .eq("email", email)
    .maybeSingle();
  if (existant?.tenant_id === c.tenantId) {
    return { ok: false, error: "Cette personne fait déjà partie de vos utilisateurs." };
  }
  if (existant && existant.tenant_id && existant.tenant_id !== c.tenantId) {
    return { ok: false, error: "Cet e-mail est déjà rattaché à une autre organisation." };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // Génère un lien d'invitation (crée le compte si besoin) et l'envoie via Resend.
  const { data, error } = await c.admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { full_name: fullName ?? null },
      redirectTo: `${base}/auth/callback?next=/bienvenue`,
    },
  });

  if (error || !data.user) {
    const message = error?.message?.includes("registered")
      ? "Un compte existe déjà avec cet e-mail."
      : (error?.message ?? "Invitation impossible.");
    return { ok: false, error: message };
  }

  // Rattache le profil au client avec le rôle choisi.
  const { error: profileError } = await c.admin
    .from("profiles")
    .update({ tenant_id: c.tenantId, role, full_name: fullName ?? null })
    .eq("id", data.user.id);
  if (profileError) return { ok: false, error: profileError.message };

  const { data: tenant } = await c.admin
    .from("tenants")
    .select("nom_societe")
    .eq("id", c.tenantId)
    .maybeSingle();

  await sendEmail({
    to: email,
    subject: `Invitation à rejoindre ${tenant?.nom_societe ?? "votre espace qualité"}`,
    html: inviteEmailHtml({
      societe: tenant?.nom_societe ?? "votre espace qualité",
      roleLabel: ROLE_MEMBRE_LABELS[role] ?? role,
      actionLink: data.properties?.action_link ?? base,
    }),
  });

  revalidatePath("/utilisateurs");
  return { ok: true };
}

const changeRoleSchema = z.object({ userId: z.string().uuid(), role: roleSchema });

/** Change le rôle d'un membre du client (pas soi-même). */
export async function changeMembreRoleAction(input: unknown): Promise<ActionResult> {
  const c = await requireManager();
  if (!c.ok) return { ok: false, error: c.error };

  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  if (parsed.data.userId === c.userId) {
    return { ok: false, error: "Vous ne pouvez pas changer votre propre rôle." };
  }

  const { error } = await c.admin
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/utilisateurs");
  return { ok: true };
}

const removeSchema = z.object({ userId: z.string().uuid() });

/** Retire l'accès d'un membre au client (révocation réversible, pas une suppression du compte). */
export async function removeMembreAction(input: unknown): Promise<ActionResult> {
  const c = await requireManager();
  if (!c.ok) return { ok: false, error: c.error };

  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  if (parsed.data.userId === c.userId) {
    return { ok: false, error: "Vous ne pouvez pas retirer votre propre accès." };
  }

  const { error } = await c.admin
    .from("profiles")
    .update({ tenant_id: null })
    .eq("id", parsed.data.userId)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/utilisateurs");
  return { ok: true };
}
