"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };
type CreateResult = { ok: true; id: string } | { ok: false; error: string };

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
  const { data, error } = await supabase
    .from("documents_maitrise")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath("/documents");
  return { ok: true, id: data.id };
}

/** Téléverse (ou remplace) le fichier rattaché à un document. */
export async function uploadDocumentFichierAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const id = String(formData.get("id") ?? "");
  const file = formData.get("file");
  if (!id) return { ok: false, error: "Document introuvable." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Aucun fichier." };
  if (file.size > MAX_TAILLE) return { ok: false, error: "Fichier trop volumineux (max 10 Mo)." };

  const supabase = await createClient();

  // Supprime un éventuel fichier précédent de chemin différent (évite les orphelins).
  const { data: existing } = await supabase
    .from("documents_maitrise")
    .select("fichier_path")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  const safeName = file.name.replace(/[^\w.\- ]/g, "_");
  const path = `${ctx.effectiveTenantId}/${id}/${safeName}`;
  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (upErr) return { ok: false, error: upErr.message };

  if (existing?.fichier_path && existing.fichier_path !== path) {
    await supabase.storage.from("documents").remove([existing.fichier_path]);
  }

  const { error } = await supabase
    .from("documents_maitrise")
    .update({
      fichier_path: path,
      fichier_nom: file.name,
      fichier_taille: file.size,
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

export async function deleteDocumentMaitriseAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents_maitrise")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}
