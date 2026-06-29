"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { prochaineReference } from "@/lib/codification-server";
import { notifyRole, notifyTenant, notifyUsers } from "@/lib/notifications";
import { canApprove, canWrite } from "@/lib/permissions";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionLettre } from "@/lib/versions";
import { softDeleteRow } from "./soft-delete";

type ProcedureUpdate = Database["public"]["Tables"]["procedures"]["Update"];

function permissions(role: string) {
  return { approver: canApprove(role), writer: canWrite(role) };
}

// Circuit à 3 rôles : brouillon → en_revue (vérification) → en_approbation
// (approbation) → approuvee, avec renvoi possible en brouillon.
const TRANSITIONS: Record<string, string[]> = {
  brouillon: ["en_revue"],
  en_revue: ["en_approbation", "brouillon"],
  en_approbation: ["approuvee", "brouillon"],
  approuvee: ["brouillon"],
  publiee: ["brouillon"],
  archivee: [],
};

const createSchema = z.object({
  titre: z.string().trim().min(2, "Titre requis."),
  processusId: z.string().uuid().optional(),
  descriptionCourte: z.string().trim().optional(),
  referenceIso: z.string().trim().optional(), // saisie libre "7.5, 8.4.1"
});

export async function createProcedureAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  const refIso = d.referenceIso
    ? d.referenceIso
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const supabase = await createClient();

  // Référence documentaire auto (PR_{processus}_{chrono}) si le processus a un
  // trigramme. Modifiable ensuite ; absente si aucun processus/trigramme.
  let code: string | null = null;
  if (d.processusId) {
    const { data: proc } = await supabase
      .from("processus")
      .select("code")
      .eq("id", d.processusId)
      .eq("tenant_id", ctx.effectiveTenantId)
      .maybeSingle();
    code = await prochaineReference(ctx.effectiveTenantId, "PR", proc?.code);
  }

  const { error } = await supabase.from("procedures").insert({
    tenant_id: ctx.effectiveTenantId,
    titre: d.titre,
    processus_id: d.processusId ?? null,
    description_courte: d.descriptionCourte ?? null,
    reference_iso: refIso,
    code,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/documentation/procedures");
  revalidatePath("/documents");
  return { ok: true };
}

/** Enregistre/corrige la référence documentaire d'une procédure (rédacteur). */
export async function saveProcedureCodeAction(id: string, code: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("procedures")
    .update({ code: code.trim() || null })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/documentation/procedures/${id}`);
  revalidatePath("/documentation/procedures");
  revalidatePath("/documents");
  return { ok: true };
}

async function loadProcedure(tenantId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select(
      "id, titre, statut, contenu, created_by, soumis_par, soumis_le, verifie_par, verifie_le, approved_by, approved_at, signature_data, redacteur, verificateur, note_revision",
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return { supabase, procedure: data };
}

export async function saveProcedureContenuAction(id: string, contenu: Json): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const { supabase, procedure } = await loadProcedure(ctx.effectiveTenantId, id);
  if (!procedure) return { ok: false, error: "Procédure introuvable." };
  if (procedure.statut !== "brouillon") {
    return { ok: false, error: "La procédure n'est modifiable qu'en brouillon." };
  }

  const { error } = await supabase
    .from("procedures")
    .update({ contenu, updated_by: ctx.userId })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const refSchema = z.object({
  numero: z.string().trim().optional().default(""),
  reference: z.string().trim().optional().default(""),
  designation: z.string().trim().optional().default(""),
});
const infosSchema = z.object({
  id: z.string().uuid(),
  objet: z.string().trim().optional(),
  noteRevision: z.string().trim().optional(),
  domaineApplication: z.string().trim().optional(),
  resume: z.string().trim().optional(),
  diffusion: z.string().trim().optional(),
  glossaireSigles: z.string().trim().optional(),
  glossaireSymboles: z.string().trim().optional(),
  glossaireAbreviations: z.string().trim().optional(),
  definitions: z
    .array(
      z.object({
        terme: z.string().trim().optional().default(""),
        definition: z.string().trim().optional().default(""),
      }),
    )
    .default([]),
  referencesDoc: z.array(refSchema).default([]),
  referencesAppli: z.array(refSchema).default([]),
});

/** Enregistre les rubriques structurées de la procédure (objet, références, définitions…). */
export async function saveProcedureInfosAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const parsed = infosSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const { supabase, procedure } = await loadProcedure(ctx.effectiveTenantId, d.id);
  if (!procedure) return { ok: false, error: "Procédure introuvable." };
  if (procedure.statut !== "brouillon") {
    return { ok: false, error: "La procédure n'est modifiable qu'en brouillon." };
  }

  const { error } = await supabase
    .from("procedures")
    .update({
      objet: d.objet ?? null,
      note_revision: d.noteRevision ?? null,
      domaine_application: d.domaineApplication ?? null,
      resume: d.resume ?? null,
      diffusion: d.diffusion ?? null,
      glossaire_sigles: d.glossaireSigles ?? null,
      glossaire_symboles: d.glossaireSymboles ?? null,
      glossaire_abreviations: d.glossaireAbreviations ?? null,
      definitions: d.definitions.filter((x) => x.terme || x.definition),
      references_doc: d.referencesDoc.filter((x) => x.reference || x.designation),
      references_appli: d.referencesAppli.filter((x) => x.reference || x.designation),
      updated_by: ctx.userId,
    })
    .eq("id", d.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/documentation/procedures/${d.id}`);
  return { ok: true };
}

export async function transitionProcedureStatutAction(
  id: string,
  target: string,
): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const { supabase, procedure } = await loadProcedure(ctx.effectiveTenantId, id);
  if (!procedure) return { ok: false, error: "Procédure introuvable." };
  if (!TRANSITIONS[procedure.statut]?.includes(target)) {
    return { ok: false, error: "Transition non autorisée." };
  }

  // Droits par étape : approuver = approbateur (dirigeant) ; vérifier/soumettre/
  // renvoyer = rédacteur/vérificateur (writer).
  const perms = permissions(ctx.role);
  const isApprouver = procedure.statut === "en_approbation" && target === "approuvee";
  const allowed = isApprouver ? perms.approver : perms.writer;
  if (!allowed) return { ok: false, error: "Droits insuffisants pour cette action." };

  // Séparation des tâches : l'approbateur ≠ rédacteur (qui a soumis) et ≠ vérificateur.
  if (isApprouver) {
    if (ctx.userId === procedure.soumis_par) {
      return { ok: false, error: "L'approbateur doit être différent du rédacteur." };
    }
    if (ctx.userId === procedure.verifie_par) {
      return { ok: false, error: "L'approbateur doit être différent du vérificateur." };
    }
  }

  const now = new Date().toISOString();
  const update: ProcedureUpdate = {
    statut: target as ProcedureUpdate["statut"],
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
    update.soumis_par = ctx.userId;
    update.soumis_le = now;
  }
  if (procedure.statut === "en_revue" && target === "en_approbation") {
    update.verifie_par = ctx.userId;
    update.verifie_le = now;
    update.verification_data = await signature();
  }
  if (isApprouver) {
    update.approved_by = ctx.userId;
    update.approved_at = now;
    update.signature_data = await signature();
  }

  const { error } = await supabase.from("procedures").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Notification ciblée sur la personne qui doit agir à l'étape suivante.
  const lien = `/documentation/procedures/${id}`;
  if (target === "en_revue") {
    await notifyRole(ctx.effectiveTenantId, ["manager", "dirigeant"], {
      type: "approval_request",
      title: "Procédure à vérifier",
      body: `La procédure « ${procedure.titre} » est en attente de vérification.`,
      link: lien,
    });
  } else if (target === "en_approbation") {
    await notifyRole(ctx.effectiveTenantId, ["dirigeant"], {
      type: "approval_request",
      title: "Procédure à approuver",
      body: `La procédure « ${procedure.titre} » a été vérifiée et attend votre approbation.`,
      link: lien,
    });
  } else if (target === "approuvee") {
    await notifyUsers([procedure.soumis_par], {
      type: "approval_granted",
      title: "Procédure approuvée",
      body: `La procédure « ${procedure.titre} » a été approuvée et signée.`,
      link: lien,
    });
  } else if (target === "brouillon" && procedure.statut !== "publiee") {
    await notifyUsers([procedure.soumis_par], {
      type: "mention",
      title: "Modifications demandées",
      body: `Des modifications sont demandées sur la procédure « ${procedure.titre} ».`,
      link: lien,
    });
  }

  revalidatePath(`/documentation/procedures/${id}`);
  return { ok: true };
}

export async function publishProcedureAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).approver) return { ok: false, error: "Droits insuffisants." };

  const { supabase, procedure } = await loadProcedure(ctx.effectiveTenantId, id);
  if (!procedure) return { ok: false, error: "Procédure introuvable." };
  if (procedure.statut !== "approuvee") {
    return { ok: false, error: "La procédure doit être approuvée avant publication." };
  }

  const { count } = await supabase
    .from("procedures_versions")
    .select("id", { count: "exact", head: true })
    .eq("procedure_id", id);
  const version = versionLettre(count ?? 0);

  // Rubriques structurées figées dans l'instantané de version (phase 2).
  const { data: sections } = await supabase
    .from("procedures")
    .select(
      "objet, domaine_application, resume, diffusion, glossaire_sigles, glossaire_symboles, glossaire_abreviations, definitions, references_doc, references_appli",
    )
    .eq("id", id)
    .maybeSingle();

  const { data: created, error: versionError } = await supabase
    .from("procedures_versions")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      procedure_id: id,
      version,
      contenu_snapshot: procedure.contenu,
      sections_snapshot: (sections ?? null) as Json,
      redige_par: procedure.soumis_par,
      redige_le: procedure.soumis_le,
      verifie_par: procedure.verifie_par,
      verifie_le: procedure.verifie_le,
      approved_by: procedure.approved_by,
      approved_at: procedure.approved_at,
      signature_data: procedure.signature_data,
      redacteur: procedure.redacteur,
      verificateur: procedure.verificateur,
      note_revision: procedure.note_revision,
    })
    .select("id")
    .single();
  if (versionError || !created) {
    return { ok: false, error: `Création de version impossible : ${versionError?.message}` };
  }

  const { error } = await supabase
    .from("procedures")
    .update({ statut: "publiee", version_actuelle_id: created.id, updated_by: ctx.userId })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await notifyTenant(ctx.effectiveTenantId, {
    type: "approval_granted",
    title: "Procédure publiée",
    body: `La procédure « ${procedure.titre} » a été publiée (version ${version}).`,
    link: `/documentation/procedures/${id}`,
  });

  revalidatePath(`/documentation/procedures/${id}`);
  return { ok: true };
}

/** Met une procédure à la corbeille (soft-delete, réversible). */
export async function deleteProcedureAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("procedures", id);
  if (r.ok) {
    revalidatePath("/documentation/procedures");
    revalidatePath("/documents");
  }
  return r;
}
