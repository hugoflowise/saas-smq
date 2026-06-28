"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { notifyUsers } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

/** Une pièce jointe d'un retour (métadonnées stockées en jsonb sur la ligne). */
export type RetourPieceJointe = {
  path: string;
  nom: string;
  taille: number;
  type: string;
};

// Garde-fous d'upload : volume raisonnable pour des captures / fichiers de contexte.
const MAX_FICHIERS = 4;
const MAX_TAILLE = 5 * 1024 * 1024; // 5 Mo par fichier

const createSchema = z.object({
  type: z.enum(["bug", "amelioration", "remarque"]),
  titre: z.string().trim().min(3, "Décrivez votre retour en quelques mots."),
  description: z.string().trim().optional(),
  pageUrl: z.string().trim().optional(),
});

/** Nettoie un nom de fichier pour un chemin de stockage sûr. */
function nomSur(nom: string): string {
  const base = nom
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "_")
    .replace(/\s+/g, "_");
  return base.slice(-80) || "fichier";
}

/**
 * Soumission d'un retour par n'importe quel utilisateur authentifié.
 * Accepte un FormData : champs texte + 0..n fichiers (captures d'écran, pièces).
 */
export async function createRetourAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };

  const parsed = createSchema.safeParse({
    type: formData.get("type"),
    titre: formData.get("titre"),
    description: formData.get("description") || undefined,
    pageUrl: formData.get("pageUrl") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  // Validation des fichiers avant tout enregistrement.
  const fichiers = formData
    .getAll("fichiers")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fichiers.length > MAX_FICHIERS) {
    return { ok: false, error: `Maximum ${MAX_FICHIERS} fichiers.` };
  }
  for (const f of fichiers) {
    if (f.size > MAX_TAILLE) {
      return { ok: false, error: `« ${f.name} » dépasse 5 Mo.` };
    }
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("retours")
    .insert({
      tenant_id: ctx.effectiveTenantId ?? null,
      type: d.type,
      titre: d.titre,
      description: d.description || null,
      page_url: d.pageUrl || null,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: error?.message ?? "Échec de l'enregistrement." };

  // Upload des fichiers côté serveur (service_role) puis enregistrement des
  // métadonnées : le bucket « retours » n'est jamais exposé au client.
  if (fichiers.length > 0) {
    const admin = createAdminClient();
    const tenantSeg = ctx.effectiveTenantId ?? "global";
    const pieces: RetourPieceJointe[] = [];
    for (const [i, f] of fichiers.entries()) {
      const path = `${tenantSeg}/${row.id}/${i}-${nomSur(f.name)}`;
      const { error: upErr } = await admin.storage
        .from("retours")
        .upload(path, await f.arrayBuffer(), {
          contentType: f.type || "application/octet-stream",
          upsert: true,
        });
      if (upErr) continue; // un fichier en échec ne doit pas perdre le retour
      pieces.push({ path, nom: f.name, taille: f.size, type: f.type || "" });
    }
    if (pieces.length > 0) {
      await admin.from("retours").update({ pieces_jointes: pieces }).eq("id", row.id);
    }
  }

  return { ok: true };
}

/**
 * URL signée pour télécharger une pièce jointe (réservé à l'admin Flowise).
 * Génère un lien temporaire à la demande, sans exposer le bucket.
 */
export async function getRetourPieceUrlAction(
  path: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (profile?.role !== "admin_flowise") {
    return { ok: false, error: "Action réservée à l'administrateur Flowise." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("retours").createSignedUrl(path, 300);
  if (error || !data) return { ok: false, error: error?.message ?? "Lien indisponible." };
  return { ok: true, url: data.signedUrl };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["nouveau", "en_cours", "traite", "rejete"]),
  noteAdmin: z.string().trim().optional(),
});

/** Traitement d'un retour (admin Flowise) : statut + note interne. */
export async function updateRetourAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (profile?.role !== "admin_flowise") {
    return { ok: false, error: "Action réservée à l'administrateur Flowise." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  // État courant (pour ne notifier que sur un vrai changement de statut)
  const { data: avant } = await supabase
    .from("retours")
    .select("statut, titre, created_by")
    .eq("id", d.id)
    .maybeSingle();

  const { error } = await supabase
    .from("retours")
    .update({ statut: d.statut, note_admin: d.noteAdmin || null })
    .eq("id", d.id);
  if (error) return { ok: false, error: error.message };

  // Notification in-app (pas d'e-mail) à l'auteur quand on passe en cours / traité.
  const statutChange = avant && avant.statut !== d.statut;
  const aNotifier = d.statut === "en_cours" || d.statut === "traite";
  if (statutChange && aNotifier && avant?.created_by) {
    const titre =
      d.statut === "traite"
        ? "Votre signalement a été traité"
        : "Votre signalement est en cours de traitement";
    await notifyUsers(
      [avant.created_by],
      { type: "retour_update", title: titre, body: avant.titre },
      { inAppOnly: true },
    );
  }

  revalidatePath("/admin/retours");
  return { ok: true };
}
