"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { notifyTenant } from "@/lib/notifications";
import { canApprove, canWrite } from "@/lib/permissions";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ProcedureUpdate = Database["public"]["Tables"]["procedures"]["Update"];

function permissions(role: string) {
  return { approver: canApprove(role), writer: canWrite(role) };
}

const TRANSITIONS: Record<string, string[]> = {
  brouillon: ["en_revue"],
  en_revue: ["brouillon", "approuvee"],
  approuvee: ["en_revue"],
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
  const { error } = await supabase.from("procedures").insert({
    tenant_id: ctx.effectiveTenantId,
    titre: d.titre,
    processus_id: d.processusId ?? null,
    description_courte: d.descriptionCourte ?? null,
    reference_iso: refIso,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/documentation/procedures");
  return { ok: true };
}

async function loadProcedure(tenantId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select(
      "id, statut, contenu, approved_by, approved_at, signature_data, redacteur, verificateur, note_revision",
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return { supabase, procedure: data };
}

const revisionSchema = z.object({
  redacteur: z.string().trim().optional(),
  verificateur: z.string().trim().optional(),
  noteRevision: z.string().trim().optional(),
});

/** Met à jour les responsabilités (rédacteur/vérificateur) et la note de révision (brouillon). */
export async function updateProcedureRevisionAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!permissions(ctx.role).writer) return { ok: false, error: "Droits insuffisants." };

  const parsed = revisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { supabase, procedure } = await loadProcedure(ctx.effectiveTenantId, id);
  if (!procedure) return { ok: false, error: "Procédure introuvable." };

  const { error } = await supabase
    .from("procedures")
    .update({
      redacteur: parsed.data.redacteur ?? null,
      verificateur: parsed.data.verificateur ?? null,
      note_revision: parsed.data.noteRevision ?? null,
      updated_by: ctx.userId,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/documentation/procedures/${id}`);
  return { ok: true };
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

  const perms = permissions(ctx.role);
  const allowed = procedure.statut === "en_revue" ? perms.approver : perms.writer;
  if (!allowed) return { ok: false, error: "Droits insuffisants pour cette action." };

  const update: ProcedureUpdate = {
    statut: target as ProcedureUpdate["statut"],
    updated_by: ctx.userId,
  };
  if (target === "approuvee") {
    const h = await headers();
    update.approved_by = ctx.userId;
    update.approved_at = new Date().toISOString();
    update.signature_data = {
      user_id: ctx.userId,
      signed_at: new Date().toISOString(),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: h.get("user-agent") ?? null,
    } satisfies Json;
  }

  const { error } = await supabase.from("procedures").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
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
  const version = `v${(count ?? 0) + 1}`;

  const { data: created, error: versionError } = await supabase
    .from("procedures_versions")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      procedure_id: id,
      version,
      contenu_snapshot: procedure.contenu,
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
    body: `Une procédure a été publiée (version ${version}).`,
    link: `/documentation/procedures/${id}`,
  });

  revalidatePath(`/documentation/procedures/${id}`);
  return { ok: true };
}
