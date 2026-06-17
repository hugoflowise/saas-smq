"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setActiveTenantId } from "@/lib/active-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ACTIONS_STANDARDS } from "@/lib/templates/actions-standards";
import { PROCESSUS_STANDARDS } from "@/lib/templates/processus";

type ActionResult = { ok: true } | { ok: false; error: string };

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
  secteur: z.enum(["SI", "ESN", "AT", "autre"]).optional(),
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
      date_souscription: new Date().toISOString().slice(0, 10),
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

  // 3) Rattachement du profil dirigeant au tenant
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      tenant_id: tenant.id,
      role: "dirigeant",
      full_name: data.dirigeantNom ?? null,
    })
    .eq("id", created.user.id);

  if (profileError) {
    return { ok: false, error: `Rattachement du dirigeant impossible : ${profileError.message}` };
  }

  // 4) Provisioning : cartographie processus standard SI/ESN (Annexe B)
  const { error: seedError } = await admin.from("processus").insert(
    PROCESSUS_STANDARDS.map((p, index) => ({
      tenant_id: tenant.id,
      nom: p.nom,
      type: p.type,
      ordre_affichage: index,
    })),
  );
  if (seedError) {
    return { ok: false, error: `Initialisation des processus impossible : ${seedError.message}` };
  }

  // 5) Provisioning : 80 actions standards ISO 9001 (démarrage SMQ)
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
    })),
  );
  if (actionsError) {
    return { ok: false, error: `Initialisation des actions impossible : ${actionsError.message}` };
  }

  revalidatePath("/admin/clients");
  return { ok: true };
}

const updateTenantSchema = z.object({
  tenantId: z.string().uuid(),
  nomSociete: z.string().trim().min(2, "Nom de société requis."),
  effectif: z.enum(["1-9", "10-49", "50-99", "100-299", "300+"]).optional(),
  secteur: z.enum(["SI", "ESN", "AT", "autre"]).optional(),
  dirigeantId: z.string().uuid().optional(),
  dirigeantNom: z.string().trim().optional(),
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
    })
    .eq("id", data.tenantId);

  if (tenantError) {
    return { ok: false, error: `Mise à jour du client impossible : ${tenantError.message}` };
  }

  if (data.dirigeantId) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: data.dirigeantNom ?? null })
      .eq("id", data.dirigeantId);
    if (profileError) {
      return { ok: false, error: `Mise à jour du dirigeant impossible : ${profileError.message}` };
    }
  }

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
