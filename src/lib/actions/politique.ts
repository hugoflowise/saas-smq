"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/actions/types";
import { notifyRole, notifyTenant, notifyUsers } from "@/lib/notifications";
import { canApprove, canWrite } from "@/lib/permissions";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionLettre } from "@/lib/versions";

type PolitiqueUpdate = Database["public"]["Tables"]["politique_qualite"]["Update"];

/**
 * Droits sur les documents maîtrisés (CDC §8) :
 * - writer (rédige, enregistre, soumet, nouvelle version) : admin Flowise, manager, dirigeant
 * - approver (approuve + signe, demande des modifs, publie) : admin Flowise, dirigeant
 */
function permissions(role: string) {
  return { approver: canApprove(role), writer: canWrite(role) };
}

/**
 * Transitions de statut autorisées (hors publication, gérée à part).
 * Circuit à 3 rôles : brouillon → en_revue (vérification) → en_approbation
 * (approbation) → approuvee, avec renvoi possible en brouillon à chaque étape.
 */
const TRANSITIONS: Record<string, string[]> = {
  brouillon: ["en_revue"],
  en_revue: ["en_approbation", "brouillon"],
  en_approbation: ["approuvee", "brouillon"],
  approuvee: ["brouillon"],
  publiee: ["brouillon"], // démarre une nouvelle version
  archivee: [],
};

async function loadPolitique(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("politique_qualite")
    .select(
      "id, statut, contenu, created_by, soumis_par, soumis_le, verifie_par, verifie_le, approved_by, approved_at, signature_data",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return { supabase, politique: data };
}

export async function savePolitiqueContenuAction(contenu: Json): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);

  if (politique && politique.statut !== "brouillon") {
    return { ok: false, error: "La politique n'est modifiable qu'en brouillon." };
  }

  const { error } = politique
    ? await supabase
        .from("politique_qualite")
        .update({ contenu, updated_by: ctx.userId })
        .eq("id", politique.id)
    : await supabase.from("politique_qualite").insert({
        tenant_id: ctx.effectiveTenantId,
        contenu,
        created_by: ctx.userId,
      });

  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath ici : éviter de rafraîchir la page pendant la frappe.
  return { ok: true };
}

/**
 * Enregistre le code documentaire de la politique (ex. « DG_SMQ_004 »).
 * Métadonnée d'identification : modifiable par un rédacteur quel que soit le
 * statut. Crée la ligne si elle n'existe pas encore.
 */
export async function savePolitiqueCodeAction(code: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const value = code.trim() || null;
  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);

  const { error } = politique
    ? await supabase
        .from("politique_qualite")
        .update({ code: value, updated_by: ctx.userId } satisfies PolitiqueUpdate)
        .eq("id", politique.id)
    : await supabase.from("politique_qualite").insert({
        tenant_id: ctx.effectiveTenantId,
        code: value,
        created_by: ctx.userId,
      });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/strategie/politique");
  revalidatePath("/print/politique");
  revalidatePath("/documents");
  return { ok: true };
}

export async function transitionPolitiqueStatutAction(target: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);
  if (!politique) return { ok: false, error: "Rédigez et enregistrez d'abord la politique." };

  if (!TRANSITIONS[politique.statut]?.includes(target)) {
    return { ok: false, error: "Transition de statut non autorisée." };
  }

  // Droits selon l'étape franchie :
  // - vérifier (en_revue → en_approbation) : rédacteur/vérificateur (writer)
  // - approuver (en_approbation → approuvee) : approbateur (dirigeant)
  // - soumettre / renvoyer / nouvelle version : writer
  const perms = permissions(ctx.role);
  const isApprouver = politique.statut === "en_approbation" && target === "approuvee";
  const allowed = isApprouver ? perms.approver : perms.writer;
  if (!allowed) return { ok: false, error: "Droits insuffisants pour cette action." };

  // Séparation des tâches : l'approbateur ne peut être ni le rédacteur (qui a
  // soumis) ni le vérificateur.
  if (isApprouver) {
    if (ctx.userId === politique.soumis_par) {
      return { ok: false, error: "L'approbateur doit être différent du rédacteur." };
    }
    if (ctx.userId === politique.verifie_par) {
      return { ok: false, error: "L'approbateur doit être différent du vérificateur." };
    }
  }

  const now = new Date().toISOString();
  const update: PolitiqueUpdate = {
    statut: target as PolitiqueUpdate["statut"],
    updated_by: ctx.userId,
  };

  const signature = async () => {
    const h = await headers();
    return {
      user_id: ctx.userId,
      signed_at: now,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: h.get("user-agent") ?? null,
    } satisfies Json;
  };

  // Soumission signée : le rédacteur signe au moment de soumettre à vérification.
  if (target === "en_revue") {
    update.soumis_par = ctx.userId;
    update.soumis_le = now;
  }

  // Vérification signée (CDC §8.3).
  if (politique.statut === "en_revue" && target === "en_approbation") {
    update.verifie_par = ctx.userId;
    update.verifie_le = now;
    update.verification_data = await signature();
  }

  // Approbation = signature électronique de la direction (CDC §8.3).
  if (isApprouver) {
    update.approved_by = ctx.userId;
    update.approved_at = now;
    update.signature_data = await signature();
  }

  const { error } = await supabase.from("politique_qualite").update(update).eq("id", politique.id);

  if (error) return { ok: false, error: error.message };

  // Notification ciblée sur la personne qui doit agir à l'étape suivante.
  const lien = "/strategie/politique";
  if (target === "en_revue") {
    // Soumise → en attente de vérification (rédacteurs/vérificateurs).
    await notifyRole(ctx.effectiveTenantId, ["manager", "dirigeant"], {
      type: "approval_request",
      title: "Politique qualité à vérifier",
      body: "La politique qualité est en attente de vérification.",
      link: lien,
    });
  } else if (target === "en_approbation") {
    // Vérifiée → en attente d'approbation (direction).
    await notifyRole(ctx.effectiveTenantId, ["dirigeant"], {
      type: "approval_request",
      title: "Politique qualité à approuver",
      body: "La politique qualité a été vérifiée et attend votre approbation.",
      link: lien,
    });
  } else if (target === "approuvee") {
    await notifyUsers([politique.soumis_par], {
      type: "approval_granted",
      title: "Politique qualité approuvée",
      body: "La politique qualité a été approuvée et signée.",
      link: lien,
    });
  } else if (target === "brouillon" && politique.statut !== "publiee") {
    await notifyUsers([politique.soumis_par], {
      type: "mention",
      title: "Modifications demandées",
      body: "Des modifications sont demandées sur la politique qualité.",
      link: lien,
    });
  }

  revalidatePath("/strategie/politique");
  return { ok: true };
}

/** Publication : crée un snapshot de version figé puis passe en "publiee". */
export async function publishPolitiqueAction(): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).approver) return { ok: false, error: "Droits insuffisants." };

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);
  if (!politique) return { ok: false, error: "Politique introuvable." };
  if (politique.statut !== "approuvee") {
    return { ok: false, error: "La politique doit être approuvée avant publication." };
  }

  const { count } = await supabase
    .from("politique_qualite_versions")
    .select("id", { count: "exact", head: true })
    .eq("politique_id", politique.id);
  const version = versionLettre(count ?? 0);

  const { data: created, error: versionError } = await supabase
    .from("politique_qualite_versions")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      politique_id: politique.id,
      version,
      contenu_snapshot: politique.contenu,
      redige_par: politique.soumis_par,
      redige_le: politique.soumis_le,
      verifie_par: politique.verifie_par,
      verifie_le: politique.verifie_le,
      approved_by: politique.approved_by,
      approved_at: politique.approved_at,
      signature_data: politique.signature_data,
    })
    .select("id")
    .single();

  if (versionError || !created) {
    return { ok: false, error: `Création de la version impossible : ${versionError?.message}` };
  }

  const { error } = await supabase
    .from("politique_qualite")
    .update({ statut: "publiee", version_actuelle_id: created.id, updated_by: ctx.userId })
    .eq("id", politique.id);

  if (error) return { ok: false, error: error.message };

  await notifyTenant(ctx.effectiveTenantId, {
    type: "approval_granted",
    title: "Politique qualité publiée",
    body: `La version ${version} de la politique qualité a été publiée.`,
    link: "/strategie/politique",
  });

  revalidatePath("/strategie/politique");
  return { ok: true };
}

/**
 * Réinitialise la politique qualité : efface le contenu et repart d'un brouillon
 * vide. La politique étant un document unique par client (contrainte d'unicité),
 * on ne supprime pas la ligne — on la vide, ce qui permet de recommencer.
 * Le paramètre `_id` n'est pas utilisé (signature commune au bouton Supprimer).
 */
export async function resetPolitiqueAction(_id?: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const { supabase, politique } = await loadPolitique(ctx.effectiveTenantId);
  if (!politique) return { ok: true }; // déjà vide

  const reset: PolitiqueUpdate = {
    contenu: null,
    statut: "brouillon",
    version_actuelle_id: null,
    approved_by: null,
    approved_at: null,
    signature_data: null,
    updated_by: ctx.userId,
  };
  const { error } = await supabase.from("politique_qualite").update(reset).eq("id", politique.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/strategie/politique");
  revalidatePath("/documents");
  return { ok: true };
}
