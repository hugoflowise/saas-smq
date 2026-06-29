"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { sendEmail, welcomeActivatedEmailHtml } from "@/lib/email";
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

/**
 * Marque le mot de passe comme défini : lève le drapeau `must_set_password` qui
 * bloquait l'accès à l'app. Appelé après une définition réussie du mot de passe
 * (page /bienvenue). Sans effet si le drapeau était déjà à false.
 */
export async function markPasswordSetAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  // On lit l'état AVANT pour ne déclencher l'e-mail de bienvenue qu'à la
  // PREMIÈRE définition du mot de passe (drapeau true → false). Un simple
  // changement de mot de passe ultérieur (depuis /compte) ne renvoie rien.
  const { data: avant } = await supabase
    .from("profiles")
    .select("must_set_password, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ must_set_password: false })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  // E-mail « votre espace est actif » (best-effort : ne doit jamais faire
  // échouer l'activation du compte).
  if (avant?.must_set_password && user.email) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendEmail({
      to: user.email,
      subject: "Votre espace qualité est actif",
      html: welcomeActivatedEmailHtml({
        prenom: avant.full_name ?? null,
        appUrl: `${base}/mise-en-route`,
      }),
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
