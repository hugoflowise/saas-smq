"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setActiveTenantId } from "@/lib/active-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
