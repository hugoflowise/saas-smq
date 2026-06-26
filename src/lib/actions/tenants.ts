"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { getActiveTenantId, setActiveTenantId } from "@/lib/active-tenant";
import { callbackLinkFromProperties } from "@/lib/auth-links";
import { inviteEmailHtml, sendEmail } from "@/lib/email";
import { todayISO } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ACTIONS_STANDARDS } from "@/lib/templates/actions-standards";
import { PARTIES_PRENANTES_STANDARDS } from "@/lib/templates/parties-prenantes";
import { PROCESSUS_STANDARDS } from "@/lib/templates/processus";

/** Vérifie que l'utilisateur courant est admin Flowise. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin_flowise") {
    return { ok: false, error: "Action réservée à l'administrateur Flowise." };
  }
  return { ok: true };
}

const createTenantSchema = z.object({
  nomSociete: z.string().trim().min(2, "Nom de société requis."),
  dirigeantEmail: z.string().trim().email("E-mail du dirigeant invalide."),
  dirigeantNom: z.string().trim().optional(),
  formule: z.enum(["Essentiel", "Tandem", "Premium"]),
  effectif: z.enum(["1-9", "10-49", "50-99", "100-299", "300+"]).optional(),
  secteur: z.enum(["SI", "ESN", "autre"]).optional(),
  bureauEtudes: z.boolean().optional(),
});

export async function createTenantAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;
  const admin = createAdminClient();

  // 1) Création du tenant
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      nom_societe: data.nomSociete,
      formule: data.formule,
      effectif_tranche: data.effectif ?? null,
      secteur: data.secteur ?? null,
      bureau_etudes: data.bureauEtudes ?? false,
      date_souscription: todayISO(),
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    return { ok: false, error: `Création du tenant impossible : ${tenantError?.message}` };
  }

  // 2) Création du compte dirigeant (sans email, connexion via magic link ensuite)
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: data.dirigeantEmail,
    email_confirm: true,
    user_metadata: { full_name: data.dirigeantNom ?? null },
  });

  if (userError || !created.user) {
    // Rollback du tenant pour ne pas laisser d'orphelin
    await admin.from("tenants").delete().eq("id", tenant.id);
    return { ok: false, error: `Création du compte dirigeant impossible : ${userError?.message}` };
  }

  // 3) Rattachement du profil dirigeant au tenant. `must_set_password` : le
  // dirigeant doit définir son mot de passe (lien de bienvenue) avant l'accès.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      tenant_id: tenant.id,
      role: "dirigeant",
      full_name: data.dirigeantNom ?? null,
      must_set_password: true,
    })
    .eq("id", created.user.id);

  if (profileError) {
    return { ok: false, error: `Rattachement du dirigeant impossible : ${profileError.message}` };
  }

  // E-mail de bienvenue : lien sécurisé pour que le dirigeant définisse son
  // mot de passe et accède à son espace (best-effort, n'échoue pas la création).
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data: lien } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: data.dirigeantEmail,
    options: { redirectTo: `${base}/auth/callback?next=/bienvenue` },
  });
  const lienCallback = callbackLinkFromProperties(base, lien?.properties, "/bienvenue");
  if (lienCallback) {
    await sendEmail({
      to: data.dirigeantEmail,
      subject: `Bienvenue sur flowise. : ${data.nomSociete}`,
      html: inviteEmailHtml({
        societe: data.nomSociete,
        roleLabel: "Dirigeant",
        actionLink: lienCallback,
      }),
    });
  }

  // Provisioning : tous les éléments préremplis sont marqués « proposés »
  // (propose: true, valide_le: null). Le client doit les revoir et les valider :
  // tant qu'ils ne le sont pas, ils sont signalés et exclus des compteurs.

  // 4) Cartographie processus standard SI/ESN (Annexe B)
  const { error: seedError } = await admin.from("processus").insert(
    PROCESSUS_STANDARDS.map((p, index) => ({
      tenant_id: tenant.id,
      nom: p.nom,
      type: p.type,
      ordre_affichage: index,
      propose: true,
    })),
  );
  if (seedError) {
    return { ok: false, error: `Initialisation des processus impossible : ${seedError.message}` };
  }

  // 5) 80 actions standards ISO 9001 (démarrage SMQ)
  const year = new Date().getFullYear();
  const { error: actionsError } = await admin.from("actions").insert(
    ACTIONS_STANDARDS.map((a) => ({
      tenant_id: tenant.id,
      reference: `ACT-${year}-${String(a.ordre).padStart(3, "0")}`,
      description_courte: a.descriptionCourte,
      description_detail: a.actionAMener || null,
      origine: "demarrage_smq" as const,
      type: a.type,
      priorite: a.priorite,
      reference_iso: a.referenceIso.length > 0 ? a.referenceIso : null,
      indicateur_efficacite: a.indicateur,
      statut: "a_faire" as const,
      propose: true,
    })),
  );
  if (actionsError) {
    return { ok: false, error: `Initialisation des actions impossible : ${actionsError.message}` };
  }

  // 6) Parties prenantes types pour une société d'ingénierie / ESN
  const { error: partiesError } = await admin.from("parties_interessees").insert(
    PARTIES_PRENANTES_STANDARDS.map((p) => ({
      tenant_id: tenant.id,
      nom: p.nom,
      type: p.type,
      sphere: p.sphere,
      niveau_interaction: p.niveauInteraction,
      pouvoir: p.pouvoir,
      legitimite: p.legitimite,
      urgence: p.urgence,
      propose: true,
    })),
  );
  if (partiesError) {
    return {
      ok: false,
      error: `Initialisation des parties prenantes impossible : ${partiesError.message}`,
    };
  }

  revalidatePath("/admin/clients");
  return { ok: true };
}

const updateTenantSchema = z.object({
  tenantId: z.string().uuid(),
  nomSociete: z.string().trim().min(2, "Nom de société requis."),
  effectif: z.enum(["1-9", "10-49", "50-99", "100-299", "300+"]).optional(),
  secteur: z.enum(["SI", "ESN", "autre"]).optional(),
  bureauEtudes: z.boolean().optional(),
  responsableFlowiseId: z.string().uuid().optional().or(z.literal("")),
});

export async function updateTenantAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;
  const admin = createAdminClient();

  const { error: tenantError } = await admin
    .from("tenants")
    .update({
      nom_societe: data.nomSociete,
      effectif_tranche: data.effectif ?? null,
      secteur: data.secteur ?? null,
      bureau_etudes: data.bureauEtudes ?? false,
      responsable_flowise_id: data.responsableFlowiseId ? data.responsableFlowiseId : null,
    })
    .eq("id", data.tenantId);

  if (tenantError) {
    return { ok: false, error: `Mise à jour du client impossible : ${tenantError.message}` };
  }

  revalidatePath("/admin/clients");
  return { ok: true };
}

// ------------------------------------------------------------------ Dirigeants
// Un client peut avoir plusieurs dirigeants (profils rôle « dirigeant » rattachés
// au tenant). Gestion réservée à l'admin Flowise depuis la fiche client.

const addDirigeantSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email("E-mail du dirigeant invalide."),
  nom: z.string().trim().optional(),
});

/** Ajoute un dirigeant au client : crée le compte, le rattache, envoie le lien de bienvenue. */
export async function addDirigeantAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = addDirigeantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { tenantId, email, nom } = parsed.data;
  const admin = createAdminClient();

  // Déjà rattaché à un client ?
  const { data: existant } = await admin
    .from("profiles")
    .select("id, tenant_id")
    .eq("email", email)
    .maybeSingle();
  if (existant?.tenant_id === tenantId) {
    return { ok: false, error: "Cette personne fait déjà partie de ce client." };
  }
  if (existant?.tenant_id && existant.tenant_id !== tenantId) {
    return { ok: false, error: "Cet e-mail est déjà rattaché à une autre organisation." };
  }

  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: nom ?? null },
  });
  if (userError || !created.user) {
    const message = userError?.message?.includes("registered")
      ? "Un compte existe déjà avec cet e-mail."
      : (userError?.message ?? "Création du compte impossible.");
    return { ok: false, error: message };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      tenant_id: tenantId,
      role: "dirigeant",
      full_name: nom ?? null,
      must_set_password: true,
    })
    .eq("id", created.user.id);
  if (profileError) {
    return { ok: false, error: `Rattachement du dirigeant impossible : ${profileError.message}` };
  }

  // Lien de bienvenue (best-effort).
  const { data: tenant } = await admin
    .from("tenants")
    .select("nom_societe")
    .eq("id", tenantId)
    .maybeSingle();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data: lien } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${base}/auth/callback?next=/bienvenue` },
  });
  const lienCallback = callbackLinkFromProperties(base, lien?.properties, "/bienvenue");
  if (lienCallback) {
    await sendEmail({
      to: email,
      subject: `Bienvenue sur flowise. : ${tenant?.nom_societe ?? ""}`,
      html: inviteEmailHtml({
        societe: tenant?.nom_societe ?? "votre espace qualité",
        roleLabel: "Dirigeant",
        actionLink: lienCallback,
      }),
    });
  }

  revalidatePath("/admin/clients");
  return { ok: true };
}

const updateDirigeantSchema = z.object({
  tenantId: z.string().uuid(),
  dirigeantId: z.string().uuid(),
  nom: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("E-mail du dirigeant invalide."),
});

/** Met à jour le nom et/ou l'adresse e-mail d'un dirigeant. */
export async function updateDirigeantAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = updateDirigeantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { tenantId, dirigeantId, nom, email } = parsed.data;
  const admin = createAdminClient();

  const { data: prof } = await admin
    .from("profiles")
    .select("id, email, tenant_id")
    .eq("id", dirigeantId)
    .maybeSingle();
  if (!prof || prof.tenant_id !== tenantId) {
    return { ok: false, error: "Dirigeant introuvable pour ce client." };
  }

  // Changement d'e-mail (auth) si modifié.
  if (email !== prof.email) {
    const { data: autre } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .neq("id", dirigeantId)
      .maybeSingle();
    if (autre) return { ok: false, error: "Cet e-mail est déjà utilisé par un autre compte." };

    const { error: authErr } = await admin.auth.admin.updateUserById(dirigeantId, {
      email,
      email_confirm: true,
    });
    if (authErr) return { ok: false, error: `Changement d'e-mail impossible : ${authErr.message}` };
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name: nom ?? null, email })
    .eq("id", dirigeantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}

const removeDirigeantSchema = z.object({
  tenantId: z.string().uuid(),
  dirigeantId: z.string().uuid(),
});

/** Retire l'accès d'un dirigeant (réversible : le compte est conservé, détaché du client). */
export async function removeDirigeantAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = removeDirigeantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const { tenantId, dirigeantId } = parsed.data;
  const admin = createAdminClient();

  // On ne retire pas le dernier dirigeant (le client doit en garder au moins un).
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "dirigeant");
  if ((count ?? 0) <= 1) {
    return { ok: false, error: "Impossible de retirer le dernier dirigeant du client." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ tenant_id: null })
    .eq("id", dirigeantId)
    .eq("tenant_id", tenantId)
    .eq("role", "dirigeant");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function uploadTenantLogoAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const tenantId = String(formData.get("tenantId") ?? "");
  const file = formData.get("file");
  if (!tenantId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Le logo doit être une image (PNG, JPG, SVG…)." };
  }
  if (file.size > 2_000_000) {
    return { ok: false, error: "Image trop lourde (max 2 Mo)." };
  }

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${tenantId}/logo-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("tenant-assets")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) return { ok: false, error: `Upload impossible : ${uploadError.message}` };

  const {
    data: { publicUrl },
  } = admin.storage.from("tenant-assets").getPublicUrl(path);

  const { error } = await admin.from("tenants").update({ logo_url: publicUrl }).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function switchTenantAction(tenantId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  await setActiveTenantId(tenantId);
  revalidatePath("/", "layout");
  return { ok: true };
}

const deleteTenantSchema = z.object({
  tenantId: z.string().uuid(),
  confirmNom: z.string().trim(),
});

/**
 * Suppression réversible d'un client (soft-delete). Sécurité : le nom de la
 * société doit être ressaisi à l'identique. Les données sont conservées, le
 * client est simplement masqué (admin + sélecteur de tenant).
 */
export async function deleteTenantAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const parsed = deleteTenantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const { tenantId, confirmNom } = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("nom_societe")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "Client introuvable." };
  if (confirmNom !== tenant.nom_societe) {
    return { ok: false, error: "Le nom saisi ne correspond pas au nom de la société." };
  }

  const { error } = await admin
    .from("tenants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  // Si c'était le client actif de l'admin, on le désélectionne.
  if ((await getActiveTenantId()) === tenantId) await setActiveTenantId("");

  revalidatePath("/admin/clients");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Restaure un client depuis la corbeille. */
export async function restoreTenantAction(tenantId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("tenants").update({ deleted_at: null }).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/", "layout");
  return { ok: true };
}
