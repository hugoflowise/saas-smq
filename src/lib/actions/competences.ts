"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const MAX_TAILLE = 10 * 1024 * 1024; // 10 Mo
const PATH = "/effectif/competences";

// ============================================================================
// Référentiel des compétences (table `competences`)
// ============================================================================

const competenceBase = {
  libelle: z.string().trim().min(2, "Libellé requis."),
  categorie: z.string().trim().optional(),
  description: z.string().trim().optional(),
};
const competenceCreate = z.object(competenceBase);
const competenceUpdate = z.object({ id: z.string().uuid(), ...competenceBase });

function competencePayload(d: z.infer<typeof competenceCreate>) {
  return {
    libelle: d.libelle,
    categorie: d.categorie ?? null,
    description: d.description ?? null,
  };
}

export async function createCompetenceAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = competenceCreate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competences")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      ...competencePayload(parsed.data),
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath(PATH);
  return { ok: true, id: data.id };
}

export async function updateCompetenceAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = competenceUpdate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("competences")
    .update({ ...competencePayload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteCompetenceAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("competences", id);
  if (r.ok) revalidatePath(PATH);
  return r;
}

// ============================================================================
// Attribution d'une compétence à une personne (table `competences_personnes`)
// ============================================================================

const attribBase = {
  consultantId: z.string().uuid("Personne requise."),
  competenceId: z.string().uuid("Compétence requise."),
  niveauRequis: z.string().trim().optional(),
  niveauAcquis: z.string().trim().optional(),
  statut: z.enum(["acquise", "a_acquerir", "a_recycler"]),
  dateObtention: z.string().optional(),
  dateEcheance: z.string().optional(),
  organisme: z.string().trim().optional(),
  commentaire: z.string().trim().optional(),
};
const attribCreate = z.object(attribBase);
const attribUpdate = z.object({ id: z.string().uuid(), ...attribBase });

function attribPayload(d: z.infer<typeof attribCreate>) {
  return {
    consultant_id: d.consultantId,
    competence_id: d.competenceId,
    niveau_requis: d.niveauRequis ?? null,
    niveau_acquis: d.niveauAcquis ?? null,
    statut: d.statut,
    date_obtention: d.dateObtention || null,
    date_echeance: d.dateEcheance || null,
    organisme: d.organisme ?? null,
    commentaire: d.commentaire ?? null,
  };
}

export async function createCompetencePersonneAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = attribCreate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competences_personnes")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      ...attribPayload(parsed.data),
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath(PATH);
  return { ok: true, id: data.id };
}

export async function updateCompetencePersonneAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = attribUpdate.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("competences_personnes")
    .update({ ...attribPayload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteCompetencePersonneAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("competences_personnes", id);
  if (r.ok) revalidatePath(PATH);
  return r;
}

// ============================================================================
// Pièce justificative (attestation, diplôme, habilitation)
// Bucket privé partagé « documents », isolé par tenant (1er segment = tenant_id),
// sous-dossier `competences/{id}`. Upload direct navigateur → Storage via URL signée.
// ============================================================================

type UploadUrl = { ok: true; path: string; token: string } | { ok: false; error: string };

/** Prépare une URL d'upload signée pour la pièce justificative d'une attribution. */
export async function createJustificatifUploadUrlAction(
  id: string,
  filename: string,
  taille: number,
): Promise<UploadUrl> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!id) return { ok: false, error: "Attribution introuvable." };
  if (taille > MAX_TAILLE) return { ok: false, error: "Fichier trop volumineux (max 10 Mo)." };

  const supabase = await createClient();
  const safeName = (filename || "fichier").replace(/[^\w.\- ]/g, "_");
  const path = `${ctx.effectiveTenantId}/competences/${id}/${safeName}`;
  const { data, error } = await supabase.storage.from("documents").createSignedUploadUrl(path, {
    upsert: true,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Préparation impossible." };
  return { ok: true, path: data.path, token: data.token };
}

/** Rattache le fichier téléversé à l'attribution (purge l'ancien si remplacé). */
export async function confirmJustificatifUploadAction(
  id: string,
  path: string,
  nom: string,
): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("competences_personnes")
    .select("justificatif_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (existing?.justificatif_path && existing.justificatif_path !== path) {
    await supabase.storage.from("documents").remove([existing.justificatif_path]);
  }

  const { error } = await supabase
    .from("competences_personnes")
    .update({ justificatif_path: path, justificatif_nom: nom, updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/** Détache et supprime la pièce justificative. */
export async function removeJustificatifAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("competences_personnes")
    .select("justificatif_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (existing?.justificatif_path) {
    await supabase.storage.from("documents").remove([existing.justificatif_path]);
  }
  const { error } = await supabase
    .from("competences_personnes")
    .update({ justificatif_path: null, justificatif_nom: null, updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/** URL signée (1 h) pour télécharger la pièce justificative. */
export async function getJustificatifUrlAction(
  id: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("competences_personnes")
    .select("justificatif_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (!row?.justificatif_path) return { ok: false, error: "Aucune pièce justificative." };
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(row.justificatif_path, 3600);
  if (error || !data) return { ok: false, error: error?.message ?? "Lien indisponible." };
  return { ok: true, url: data.signedUrl };
}
