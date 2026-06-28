"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { loadFicheProcessusData } from "@/lib/fiche-processus-data";
import { notifyRole, notifyTenant, notifyUsers } from "@/lib/notifications";
import { canApprove, canWrite } from "@/lib/permissions";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionLettre } from "@/lib/versions";

type ProcessusUpdate = Database["public"]["Tables"]["processus"]["Update"];

const ficheSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().trim().min(2, "Nom requis."),
  intituleLong: z.string().trim().optional(),
  type: z.enum(["pilotage", "realisation", "support"]),
  pilotes: z
    .array(
      z.object({
        piloteId: z.string().uuid().optional().or(z.literal("")),
        piloteNom: z.string().trim().optional(),
      }),
    )
    .default([]),
  dateDerniereRevue: z.string().optional(),
  dateProchaineRevue: z.string().optional(),
  finalite: z.string().trim().optional(),
  perimetre: z.string().trim().optional(),
  referentiels: z.string().trim().optional(),
  entrees: z.string().trim().optional(),
  sorties: z.string().trim().optional(),
  ressourcesHumaines: z.string().trim().optional(),
  ressourcesMaterielles: z.string().trim().optional(),
  ressourcesLogicielles: z.string().trim().optional(),
  ressourcesFinancieres: z.string().trim().optional(),
  ressourcesDocumentaires: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  activites: z
    .array(
      z.object({
        activite: z.string().trim().min(1),
        responsable: z.string().trim().optional(),
      }),
    )
    .default([]),
  interactions: z
    .array(
      z.object({
        fournisseur: z.string().trim().optional(),
        nature: z.string().trim().optional(),
        client: z.string().trim().optional(),
      }),
    )
    .default([]),
});

/** Enregistre la fiche d'identité d'un processus (identité + activités + interactions). */
export async function saveFicheProcessusAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const parsed = ficheSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  // Modifiable uniquement en brouillon (comme les autres documents maîtrisés).
  const { data: current } = await supabase
    .from("processus")
    .select("fiche_statut, fiche_redige_par")
    .eq("id", d.id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (current && current.fiche_statut !== "brouillon") {
    return { ok: false, error: "La fiche n'est modifiable qu'en brouillon." };
  }

  const { error: upErr } = await supabase
    .from("processus")
    .update({
      nom: d.nom,
      intitule_long: d.intituleLong ?? null,
      type: d.type,
      date_derniere_revue: d.dateDerniereRevue || null,
      date_prochaine_revue: d.dateProchaineRevue || null,
      finalite: d.finalite ?? null,
      perimetre: d.perimetre ?? null,
      referentiels: d.referentiels ?? null,
      entrees: d.entrees ?? null,
      sorties: d.sorties ?? null,
      ressources_humaines: d.ressourcesHumaines ?? null,
      ressources_materielles: d.ressourcesMaterielles ?? null,
      ressources_logicielles: d.ressourcesLogicielles ?? null,
      ressources_financieres: d.ressourcesFinancieres ?? null,
      ressources_documentaires: d.ressourcesDocumentaires ?? null,
      fiche_reference: d.reference ?? null,
      // Rédacteur = premier auteur du brouillon (renseigné automatiquement).
      fiche_redige_par: current?.fiche_redige_par ?? ctx.userId,
      fiche_redige_le: current?.fiche_redige_par ? undefined : new Date().toISOString(),
      updated_by: ctx.userId,
    })
    .eq("id", d.id)
    .eq("tenant_id", tid);
  if (upErr) return { ok: false, error: upErr.message };

  // Remplacement complet des lignes filles (pilotes, activités, interactions).
  await supabase.from("processus_pilotes").delete().eq("processus_id", d.id).eq("tenant_id", tid);
  // On ne garde que les lignes désignant un utilisateur ou un nom libre.
  const pilotes = d.pilotes
    .map((pl) => ({
      piloteId: pl.piloteId?.trim() ? pl.piloteId.trim() : null,
      piloteNom: pl.piloteNom?.trim() ? pl.piloteNom.trim() : null,
    }))
    .filter((pl) => pl.piloteId || pl.piloteNom);
  if (pilotes.length > 0) {
    const { error } = await supabase.from("processus_pilotes").insert(
      pilotes.map((pl, i) => ({
        tenant_id: tid,
        processus_id: d.id,
        ordre: i,
        // Nom libre prioritaire : si renseigné, on n'enregistre pas d'utilisateur lié.
        pilote_id: pl.piloteNom ? null : pl.piloteId,
        pilote_nom: pl.piloteNom,
        created_by: ctx.userId,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await supabase.from("processus_activites").delete().eq("processus_id", d.id).eq("tenant_id", tid);
  if (d.activites.length > 0) {
    const { error } = await supabase.from("processus_activites").insert(
      d.activites.map((a, i) => ({
        tenant_id: tid,
        processus_id: d.id,
        ordre: i,
        activite: a.activite,
        responsable: a.responsable ?? null,
        created_by: ctx.userId,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await supabase
    .from("processus_interactions")
    .delete()
    .eq("processus_id", d.id)
    .eq("tenant_id", tid);
  // On ne garde que les lignes ayant au moins un fournisseur ou un client.
  const interactions = d.interactions.filter((it) => it.fournisseur || it.client);
  if (interactions.length > 0) {
    const { error } = await supabase.from("processus_interactions").insert(
      interactions.map((it, i) => ({
        tenant_id: tid,
        processus_id: d.id,
        ordre: i,
        fournisseur: it.fournisseur ?? null,
        client: it.client ?? null,
        nature: it.nature ?? null,
        // Colonnes héritées (NOT NULL) conservées pour compatibilité.
        sens: "entrant" as const,
        partenaire: it.fournisseur || it.client || "-",
        created_by: ctx.userId,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/processus/${d.id}`);
  return { ok: true };
}

/** Transitions de statut autorisées (publication gérée à part). */
// Circuit à 3 rôles : brouillon → en_revue (vérification) → en_approbation
// (approbation) → approuvee, avec renvoi possible en brouillon.
const TRANSITIONS: Record<string, string[]> = {
  brouillon: ["en_revue"],
  en_revue: ["en_approbation", "brouillon"],
  en_approbation: ["approuvee", "brouillon"],
  approuvee: ["brouillon"],
  publiee: ["brouillon"], // démarre une nouvelle version
  archivee: [],
};

/**
 * Change le statut de la fiche dans le cycle de vie documentaire.
 * - soumettre (brouillon -> en_revue) et nouvelle version (publiee -> brouillon) : rédacteur
 * - demander des modifs / approuver (depuis en_revue) : approbateur (dirigeant)
 * L'approbation est signée électroniquement.
 */
export async function transitionFicheAction(id: string, target: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const tid = ctx.effectiveTenantId;

  const supabase = await createClient();
  const { data: fiche } = await supabase
    .from("processus")
    .select("fiche_statut, fiche_redige_par, fiche_soumis_par, fiche_verifie_par, nom")
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!fiche) return { ok: false, error: "Fiche introuvable." };
  const statutAvant = fiche.fiche_statut;

  if (!TRANSITIONS[fiche.fiche_statut]?.includes(target)) {
    return { ok: false, error: "Transition non autorisée." };
  }

  // Droits par étape : approuver = approbateur (dirigeant) ; vérifier/soumettre/
  // renvoyer = rédacteur/vérificateur (writer).
  const isApprouver = fiche.fiche_statut === "en_approbation" && target === "approuvee";
  const allowed = isApprouver ? canApprove(ctx.role) : canWrite(ctx.role);
  if (!allowed) return { ok: false, error: "Droits insuffisants pour cette action." };

  // Séparation des tâches : l'approbateur ≠ rédacteur (qui a soumis) et ≠ vérificateur.
  if (isApprouver) {
    if (ctx.userId === fiche.fiche_soumis_par || ctx.userId === fiche.fiche_redige_par) {
      return { ok: false, error: "L'approbateur doit être différent du rédacteur." };
    }
    if (ctx.userId === fiche.fiche_verifie_par) {
      return { ok: false, error: "L'approbateur doit être différent du vérificateur." };
    }
  }

  const now = new Date().toISOString();
  const update: ProcessusUpdate = {
    fiche_statut: target as ProcessusUpdate["fiche_statut"],
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

  if (target === "en_revue") {
    update.fiche_soumis_par = ctx.userId;
    update.fiche_soumis_le = now;
    // Filet de sécurité : si la fiche n'a pas encore de rédacteur (processus
    // créé sans passer par l'éditeur), on l'attribue à celui qui la soumet.
    if (!fiche.fiche_redige_par) {
      update.fiche_redige_par = ctx.userId;
      update.fiche_redige_le = now;
    }
  }

  if (fiche.fiche_statut === "en_revue" && target === "en_approbation") {
    update.fiche_verifie_par = ctx.userId;
    update.fiche_verifie_le = now;
    update.fiche_verification_data = await signature();
  }

  if (isApprouver) {
    update.fiche_approuvee_par = ctx.userId;
    update.fiche_approuvee_le = now;
    update.fiche_signature = await signature();
  }

  const { error } = await supabase
    .from("processus")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", tid);
  if (error) return { ok: false, error: error.message };

  // Notification ciblée sur la personne qui doit agir à l'étape suivante.
  const lien = `/processus/${id}`;
  if (target === "en_revue") {
    await notifyRole(tid, ["manager", "dirigeant"], {
      type: "approval_request",
      title: "Fiche d'identité à vérifier",
      body: `La fiche du processus « ${fiche.nom} » est en attente de vérification.`,
      link: lien,
    });
  } else if (target === "en_approbation") {
    await notifyRole(tid, ["dirigeant"], {
      type: "approval_request",
      title: "Fiche d'identité à approuver",
      body: `La fiche du processus « ${fiche.nom} » a été vérifiée et attend votre approbation.`,
      link: lien,
    });
  } else if (target === "approuvee") {
    await notifyUsers([fiche.fiche_soumis_par ?? fiche.fiche_redige_par], {
      type: "approval_granted",
      title: "Fiche d'identité approuvée",
      body: `La fiche du processus « ${fiche.nom} » a été approuvée et signée.`,
      link: lien,
    });
  } else if (target === "brouillon" && statutAvant !== "publiee") {
    await notifyUsers([fiche.fiche_soumis_par ?? fiche.fiche_redige_par], {
      type: "mention",
      title: "Modifications demandées",
      body: `Des modifications sont demandées sur la fiche du processus « ${fiche.nom} ».`,
      link: lien,
    });
  }

  revalidatePath(`/processus/${id}`);
  return { ok: true };
}

/** Publie la fiche approuvée : fige la version (A, B, C…) et sa date. */
export async function publishFicheAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canApprove(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  const tid = ctx.effectiveTenantId;

  const supabase = await createClient();
  const { data: fiche } = await supabase
    .from("processus")
    .select(
      "nom, fiche_statut, fiche_redige_par, fiche_soumis_par, fiche_approuvee_par, fiche_approuvee_le, fiche_signature",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!fiche) return { ok: false, error: "Fiche introuvable." };
  if (fiche.fiche_statut !== "approuvee") {
    return { ok: false, error: "La fiche doit être approuvée avant publication." };
  }

  // Version = lettre suivante d'après le nombre de versions déjà figées (A, B, C…).
  const { count } = await supabase
    .from("processus_fiche_versions")
    .select("id", { count: "exact", head: true })
    .eq("processus_id", id);
  const version = versionLettre(count ?? 0);
  const publishedAt = new Date().toISOString();

  // Instantané complet de la fiche au moment de la publication.
  const loaded = await loadFicheProcessusData(tid, id);
  const snapshot = loaded
    ? ({ ...loaded.data, version, versionDate: publishedAt, statut: "publiee" } as unknown as Json)
    : null;

  const { error: versionError } = await supabase.from("processus_fiche_versions").insert({
    tenant_id: tid,
    processus_id: id,
    version,
    snapshot,
    redige_par: fiche.fiche_redige_par,
    soumis_par: fiche.fiche_soumis_par,
    approved_by: fiche.fiche_approuvee_par,
    approved_at: fiche.fiche_approuvee_le,
    signature_data: fiche.fiche_signature,
  });
  if (versionError) {
    return { ok: false, error: `Création de la version impossible : ${versionError.message}` };
  }

  const { error } = await supabase
    .from("processus")
    .update({
      fiche_statut: "publiee",
      fiche_version: version,
      fiche_publiee_le: publishedAt,
      updated_by: ctx.userId,
    })
    .eq("id", id)
    .eq("tenant_id", tid);
  if (error) return { ok: false, error: error.message };

  await notifyTenant(tid, {
    type: "approval_granted",
    title: "Fiche d'identité publiée",
    body: `La fiche du processus « ${fiche.nom} » a été publiée (version ${version}).`,
    link: `/processus/${id}`,
  });

  revalidatePath(`/processus/${id}`);
  return { ok: true };
}
