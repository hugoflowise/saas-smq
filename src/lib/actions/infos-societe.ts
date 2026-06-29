"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";

const schema = z.object({
  formeJuridique: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  codePostal: z.string().trim().optional(),
  ville: z.string().trim().optional(),
  mentionsLegales: z.string().trim().optional(),
  listeDiffusion: z.string().trim().optional(),
  couleurCharte: z
    .string()
    .trim()
    .regex(/^#?[0-9a-f]{6}$/i, "Couleur invalide (format #rrggbb).")
    .optional(),
});

/** Met à jour les informations légales du client (réservé dirigeant/admin). */
export async function updateInfosSocieteAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (ctx.role !== "admin_flowise" && ctx.role !== "dirigeant") {
    return { ok: false, error: "Droits insuffisants." };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({
      forme_juridique: d.formeJuridique ?? null,
      siret: d.siret ?? null,
      adresse: d.adresse ?? null,
      code_postal: d.codePostal ?? null,
      ville: d.ville ?? null,
      mentions_legales: d.mentionsLegales ?? null,
      liste_diffusion: d.listeDiffusion ?? null,
      couleur_charte: d.couleurCharte
        ? d.couleurCharte.startsWith("#")
          ? d.couleurCharte
          : `#${d.couleurCharte}`
        : null,
    })
    .eq("id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/parametres");
  return { ok: true };
}

/**
 * Téléverse le logo de la société (réservé dirigeant/admin). Permet au client
 * lui-même de gérer son logo, sans passer par un admin Flowise. Le logo apparaît
 * sur les documents générés (politique, procédures, fiches…).
 */
export async function uploadLogoSocieteAction(formData: FormData): Promise<ActionResult> {
  // Garde-fou décalage de version (cf. createRetourAction).
  if (!(formData instanceof FormData)) {
    return { ok: false, error: "Session expirée. Rechargez la page et réessayez." };
  }
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (ctx.role !== "admin_flowise" && ctx.role !== "dirigeant") {
    return { ok: false, error: "Droits insuffisants." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Le logo doit être une image (PNG, JPG, SVG…)." };
  }
  if (file.size > 2_000_000) {
    return { ok: false, error: "Image trop lourde (max 2 Mo)." };
  }

  const admin = createAdminClient();
  const tenantId = ctx.effectiveTenantId;
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${tenantId}/logo-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("tenant-assets")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) return { ok: false, error: `Téléversement impossible : ${uploadError.message}` };

  const {
    data: { publicUrl },
  } = admin.storage.from("tenant-assets").getPublicUrl(path);

  const { error } = await admin.from("tenants").update({ logo_url: publicUrl }).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/parametres");
  return { ok: true };
}
