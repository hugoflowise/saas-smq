"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { TYPE_MAITRISE_TO_FAMILLE } from "@/lib/codification";
import { prochaineReference } from "@/lib/codification-server";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const MAX_TAILLE = 10 * 1024 * 1024; // 10 Mo

const base = {
  code: z.string().trim().optional(),
  titre: z.string().trim().min(2, "Titre requis."),
  type: z.enum([
    "manuel",
    "procedure",
    "instruction",
    "enregistrement",
    "formulaire",
    "document_externe",
    "autre",
  ]),
  version: z.string().trim().optional(),
  statut: z.enum(["brouillon", "en_vigueur", "archive"]),
  redacteur: z.string().trim().optional(),
  approbateur: z.string().trim().optional(),
  dateApprobation: z.string().optional(),
  dateRevisionPrevue: z.string().optional(),
  dureeConservation: z.string().trim().optional(),
  processusId: z.string().uuid().optional(),
  emplacement: z.string().trim().optional(),
  commentaire: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    code: d.code ?? null,
    titre: d.titre,
    type: d.type,
    version: d.version ?? null,
    statut: d.statut,
    redacteur: d.redacteur ?? null,
    approbateur: d.approbateur ?? null,
    date_approbation: d.dateApprobation || null,
    date_revision_prevue: d.dateRevisionPrevue || null,
    duree_conservation: d.dureeConservation ?? null,
    processus_id: d.processusId ?? null,
    emplacement: d.emplacement ?? null,
    commentaire: d.commentaire ?? null,
  };
}

export async function createDocumentMaitriseAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();

  // Code documentaire : on respecte la saisie si présente, sinon génération
  // automatique `{FAMILLE}_{PROCESSUS}_{CHRONO}` quand le type est codifiable
  // et que le processus a un trigramme.
  const body = payload(parsed.data);
  if (!body.code) {
    const famille = TYPE_MAITRISE_TO_FAMILLE[parsed.data.type];
    if (famille && parsed.data.processusId) {
      const { data: proc } = await supabase
        .from("processus")
        .select("code")
        .eq("id", parsed.data.processusId)
        .eq("tenant_id", ctx.effectiveTenantId)
        .maybeSingle();
      body.code = await prochaineReference(ctx.effectiveTenantId, famille, proc?.code);
    }
  }

  const { data, error } = await supabase
    .from("documents_maitrise")
    .insert({ tenant_id: ctx.effectiveTenantId, ...body, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath("/documents");
  return { ok: true, id: data.id };
}

/**
 * Résultat de la prévisualisation du prochain code documentaire. `code` vaut
 * `null` quand le type n'est pas codifié automatiquement ou que le processus
 * n'a pas de trigramme : dans ce cas il n'y a pas de code auto à proposer.
 */
type PreviewCodeResult = { ok: true; code: string | null } | { ok: false; error: string };

const previewCodeSchema = z.object({
  type: base.type,
  processusId: z.string().uuid(),
});

/**
 * Calcule, sans rien enregistrer, le prochain code documentaire disponible pour
 * un couple (type → famille, processus). Sert d'aperçu indicatif à la création
 * d'un document (le serveur reste seul juge à l'insertion réelle).
 */
export async function previewDocumentCodeAction(input: unknown): Promise<PreviewCodeResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = previewCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const famille = TYPE_MAITRISE_TO_FAMILLE[parsed.data.type];
  if (!famille) return { ok: true, code: null };

  const supabase = await createClient();
  const { data: proc } = await supabase
    .from("processus")
    .select("code")
    .eq("id", parsed.data.processusId)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  const code = await prochaineReference(ctx.effectiveTenantId, famille, proc?.code);
  return { ok: true, code };
}

type UploadUrl = { ok: true; path: string; token: string } | { ok: false; error: string };

/**
 * Prépare une URL d'upload signée : le fichier est ensuite envoyé directement
 * du navigateur vers Supabase Storage (évite la limite de taille des server
 * actions / du corps de requête Vercel).
 */
export async function createDocumentUploadUrlAction(
  id: string,
  filename: string,
  taille: number,
): Promise<UploadUrl> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!id) return { ok: false, error: "Document introuvable." };
  if (taille > MAX_TAILLE) return { ok: false, error: "Fichier trop volumineux (max 10 Mo)." };

  const supabase = await createClient();
  const safeName = (filename || "fichier").replace(/[^\w.\- ]/g, "_");
  const path = `${ctx.effectiveTenantId}/${id}/${safeName}`;
  const { data, error } = await supabase.storage.from("documents").createSignedUploadUrl(path, {
    upsert: true,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Préparation impossible." };
  return { ok: true, path: data.path, token: data.token };
}

/** Enregistre le fichier téléversé sur le document (et purge l'ancien si besoin). */
export async function confirmDocumentUploadAction(
  id: string,
  path: string,
  nom: string,
  taille: number,
): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("documents_maitrise")
    .select("fichier_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (existing?.fichier_path && existing.fichier_path !== path) {
    await supabase.storage.from("documents").remove([existing.fichier_path]);
  }

  const { error } = await supabase
    .from("documents_maitrise")
    .update({
      fichier_path: path,
      fichier_nom: nom,
      fichier_taille: taille,
      updated_by: ctx.userId,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

export async function removeDocumentFichierAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("documents_maitrise")
    .select("fichier_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (existing?.fichier_path) {
    await supabase.storage.from("documents").remove([existing.fichier_path]);
  }
  const { error } = await supabase
    .from("documents_maitrise")
    .update({ fichier_path: null, fichier_nom: null, fichier_taille: null, updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

/** URL signée (1 h) pour télécharger le fichier d'un document. */
export async function getDocumentFichierUrlAction(
  id: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents_maitrise")
    .select("fichier_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (!doc?.fichier_path) return { ok: false, error: "Aucun fichier." };
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.fichier_path, 3600);
  if (error || !data) return { ok: false, error: error?.message ?? "Lien indisponible." };
  return { ok: true, url: data.signedUrl };
}

export async function updateDocumentMaitriseAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents_maitrise")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

// Édition inline depuis la liste maîtresse : on ne patche qu'un champ à la fois
// (révision prévue, durée de stockage) sans rouvrir tout le dialogue.
const quickSchema = z.object({
  id: z.string().uuid(),
  dateRevisionPrevue: z.string().optional(),
  dureeConservation: z.string().optional(),
});

export async function quickUpdateDocumentMaitriseAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = quickSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  // On ne met à jour que les champs réellement fournis (« vide » = effacement).
  const patch: Database["public"]["Tables"]["documents_maitrise"]["Update"] = {
    updated_by: ctx.userId,
  };
  if (d.dateRevisionPrevue !== undefined) patch.date_revision_prevue = d.dateRevisionPrevue || null;
  if (d.dureeConservation !== undefined) patch.duree_conservation = d.dureeConservation || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents_maitrise")
    .update(patch)
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

// Révision prévue éditable depuis la liste maîtresse, quelle que soit la source.
// La colonne diffère : date_prochaine_revue pour les fiches de processus,
// date_revision_prevue pour les autres documents.
const revisionSchema = z.object({
  source: z.enum(["politique", "procedure", "processus", "registre"]),
  id: z.string().uuid(),
  date: z.string().optional(),
});

export async function quickUpdateRevisionAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = revisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { source, id, date } = parsed.data;
  const value = date || null;
  const by = ctx.userId;
  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  let error: { message: string } | null = null;
  if (source === "politique") {
    ({ error } = await supabase
      .from("politique_qualite")
      .update({ date_revision_prevue: value, updated_by: by })
      .eq("id", id)
      .eq("tenant_id", tid));
  } else if (source === "procedure") {
    ({ error } = await supabase
      .from("procedures")
      .update({ date_revision_prevue: value, updated_by: by })
      .eq("id", id)
      .eq("tenant_id", tid));
  } else if (source === "processus") {
    ({ error } = await supabase
      .from("processus")
      .update({ date_prochaine_revue: value, updated_by: by })
      .eq("id", id)
      .eq("tenant_id", tid));
  } else {
    ({ error } = await supabase
      .from("documents_maitrise")
      .update({ date_revision_prevue: value, updated_by: by })
      .eq("id", id)
      .eq("tenant_id", tid));
  }
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

export async function deleteDocumentMaitriseAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("documents_maitrise", id);
  if (r.ok) revalidatePath("/documents");
  return r;
}
