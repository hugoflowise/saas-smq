"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

const nomSchema = z.object({ fullName: z.string().trim().min(2, "Nom trop court.") });

/**
 * Met à jour le nom complet de l'utilisateur connecté (profil + métadonnées
 * auth). C'est ce nom qui s'affiche partout (pilote, signatures, etc.).
 */
export async function updateMonNomAction(input: unknown): Promise<ActionResult> {
  const parsed = nomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nom invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  // Garde les métadonnées auth alignées (best-effort).
  await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });

  revalidatePath("/compte");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Enregistre (ou efface) la signature manuscrite réutilisable de l'utilisateur.
 * `image` est une data URL PNG/JPEG, ou une chaîne vide pour supprimer.
 */
export async function updateMaSignatureAction(image: unknown): Promise<ActionResult> {
  const valeur = typeof image === "string" ? image.trim() : "";
  if (valeur) {
    if (!/^data:image\/(png|jpeg);base64,/.test(valeur)) {
      return { ok: false, error: "Format de signature invalide (PNG ou JPEG attendu)." };
    }
    // ~700 Ko max en base64 (≈ 500 Ko d'image).
    if (valeur.length > 700_000) {
      return { ok: false, error: "Signature trop lourde (max ~500 Ko)." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase
    .from("profiles")
    .update({ signature_image: valeur || null })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/compte");
  return { ok: true };
}
