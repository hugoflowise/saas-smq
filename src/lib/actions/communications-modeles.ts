"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import { canWrite } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

/** Une pièce jointe d'un modèle (métadonnées stockées en jsonb sur la ligne). */
export type ModelePieceJointe = { path: string; nom: string; taille: number; type: string };

const MAX_PIECES = 5;
const MAX_TAILLE = 10 * 1024 * 1024; // 10 Mo (fichier téléchargé puis joint au mail)

function nomSur(nom: string): string {
  const base = nom
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "_")
    .replace(/\s+/g, "_");
  return base.slice(-80) || "fichier";
}

/** Récupère le modèle (RLS = périmètre client) avec ses PJ, ou null. */
async function chargerModele(modeleId: string) {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("communication_modeles")
    .select("id, tenant_id, pieces_jointes")
    .eq("id", modeleId)
    .maybeSingle();
  if (!data) return null;
  return { ctx, pieces: (data.pieces_jointes ?? []) as ModelePieceJointe[] };
}

const base = {
  categorie: z.string().trim().min(1),
  titre: z.string().trim().min(2, "Titre requis."),
  objet: z.string().trim().min(2, "Objet requis."),
  corps: z.string().default(""),
};
// À la création, `modeleSource` mémorise le modèle fourni matérialisé (le cas échéant).
const createSchema = z.object({ ...base, modeleSource: z.string().trim().optional() });
const updateSchema = z.object({ id: z.string().uuid(), ...base });

export async function createModeleAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { modeleSource, ...champs } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communication_modeles")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      ...champs,
      modele_source: modeleSource ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath("/communications");
  return { ok: true, id: data.id };
}

export async function updateModeleAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("communication_modeles")
    .update({ ...rest, updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true };
}

export async function deleteModeleAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("communication_modeles", id);
  if (r.ok) revalidatePath("/communications");
  return r;
}

/** Journalise une communication envoyée (traçabilité ISO §7.4). */
export async function logCommunicationEnvoyeeAction(input: {
  sujet: string;
  audience: string;
  message?: string;
}): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const sujet = (input.sujet ?? "").trim();
  if (sujet.length < 2) return { ok: false, error: "Sujet manquant." };

  const supabase = await createClient();
  const { error } = await supabase.from("communications").insert({
    tenant_id: ctx.effectiveTenantId,
    sujet,
    type: "communique",
    canal: "email",
    audience: input.audience || null,
    message: input.message ?? null,
    statut: "realisee",
    date_realisee: todayISO(),
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true };
}

type PiecesResult = { ok: true; pieces: ModelePieceJointe[] } | { ok: false; error: string };

/** Ajoute une ou plusieurs pièces jointes à un modèle (upload côté serveur). */
export async function uploadModelePieceAction(formData: FormData): Promise<PiecesResult> {
  if (!(formData instanceof FormData)) {
    return { ok: false, error: "Session expirée. Rechargez la page." };
  }
  const modeleId = String(formData.get("modeleId") ?? "");
  const infos = await chargerModele(modeleId);
  if (!infos) return { ok: false, error: "Modèle introuvable." };
  if (!canWrite(infos.ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const fichiers = formData
    .getAll("fichiers")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fichiers.length === 0) return { ok: false, error: "Aucun fichier." };
  if (infos.pieces.length + fichiers.length > MAX_PIECES) {
    return { ok: false, error: `Maximum ${MAX_PIECES} pièces jointes par modèle.` };
  }
  for (const f of fichiers) {
    if (f.size > MAX_TAILLE) return { ok: false, error: `« ${f.name} » dépasse 10 Mo.` };
  }

  const admin = createAdminClient();
  const tenantSeg = infos.ctx.effectiveTenantId ?? "global";
  const ajoutees: ModelePieceJointe[] = [];
  for (const f of fichiers) {
    const path = `${tenantSeg}/${modeleId}/${Date.now()}-${nomSur(f.name)}`;
    const { error: upErr } = await admin.storage
      .from("communications")
      .upload(path, await f.arrayBuffer(), {
        contentType: f.type || "application/octet-stream",
        upsert: true,
      });
    if (upErr) return { ok: false, error: upErr.message };
    ajoutees.push({ path, nom: f.name, taille: f.size, type: f.type || "" });
  }

  const pieces = [...infos.pieces, ...ajoutees];
  const { error } = await admin
    .from("communication_modeles")
    .update({ pieces_jointes: pieces as unknown as Json })
    .eq("id", modeleId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true, pieces };
}

/** Retire une pièce jointe d'un modèle (storage + métadonnées). */
export async function deleteModelePieceAction(
  modeleId: string,
  path: string,
): Promise<PiecesResult> {
  const infos = await chargerModele(modeleId);
  if (!infos) return { ok: false, error: "Modèle introuvable." };
  if (!canWrite(infos.ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const admin = createAdminClient();
  await admin.storage.from("communications").remove([path]);
  const pieces = infos.pieces.filter((p) => p.path !== path);
  const { error } = await admin
    .from("communication_modeles")
    .update({ pieces_jointes: pieces as unknown as Json })
    .eq("id", modeleId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true, pieces };
}

/** URL signée (5 min) pour télécharger une pièce jointe d'un modèle du client. */
export async function getModelePieceUrlAction(
  modeleId: string,
  path: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const infos = await chargerModele(modeleId);
  if (!infos) return { ok: false, error: "Modèle introuvable." };
  if (!infos.pieces.some((p) => p.path === path)) {
    return { ok: false, error: "Pièce jointe introuvable." };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("communications").createSignedUrl(path, 300);
  if (error || !data) return { ok: false, error: error?.message ?? "Lien indisponible." };
  return { ok: true, url: data.signedUrl };
}
