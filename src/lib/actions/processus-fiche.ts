"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { canApprove, canWrite } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const ficheSchema = z.object({
  id: z.string().uuid(),
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
  ficheRedacteur: z.string().trim().optional(),
  ficheVerificateur: z.string().trim().optional(),
  ficheVersion: z.string().trim().optional(),
  ficheNoteRevision: z.string().trim().optional(),
  activites: z
    .array(
      z.object({
        activite: z.string().trim().min(1),
        responsable: z.string().trim().optional(),
        documents: z.string().trim().optional(),
      }),
    )
    .default([]),
  interactions: z
    .array(
      z.object({
        sens: z.enum(["entrant", "sortant"]),
        partenaire: z.string().trim().min(1),
        nature: z.string().trim().optional(),
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

  const { error: upErr } = await supabase
    .from("processus")
    .update({
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
      fiche_redacteur: d.ficheRedacteur ?? null,
      fiche_verificateur: d.ficheVerificateur ?? null,
      fiche_version: d.ficheVersion ?? null,
      fiche_note_revision: d.ficheNoteRevision ?? null,
      updated_by: ctx.userId,
    })
    .eq("id", d.id)
    .eq("tenant_id", tid);
  if (upErr) return { ok: false, error: upErr.message };

  // Remplacement complet des lignes filles (activités, interactions).
  await supabase.from("processus_activites").delete().eq("processus_id", d.id).eq("tenant_id", tid);
  if (d.activites.length > 0) {
    const { error } = await supabase.from("processus_activites").insert(
      d.activites.map((a, i) => ({
        tenant_id: tid,
        processus_id: d.id,
        ordre: i,
        activite: a.activite,
        responsable: a.responsable ?? null,
        documents: a.documents ?? null,
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
  if (d.interactions.length > 0) {
    const { error } = await supabase.from("processus_interactions").insert(
      d.interactions.map((it, i) => ({
        tenant_id: tid,
        processus_id: d.id,
        ordre: i,
        sens: it.sens,
        partenaire: it.partenaire,
        nature: it.nature ?? null,
        created_by: ctx.userId,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/processus/${d.id}`);
  return { ok: true };
}

/** Approuve et signe la fiche d'identité (réservé dirigeant/admin). */
export async function approveFicheProcessusAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canApprove(ctx.role)) return { ok: false, error: "Seul le dirigeant peut approuver." };

  const supabase = await createClient();
  const h = await headers();
  const { data: existing } = await supabase
    .from("processus")
    .select("fiche_version")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();

  const { error } = await supabase
    .from("processus")
    .update({
      fiche_approuvee_par: ctx.userId,
      fiche_approuvee_le: new Date().toISOString(),
      fiche_version: existing?.fiche_version || "A",
      fiche_signature: {
        user_id: ctx.userId,
        signed_at: new Date().toISOString(),
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        user_agent: h.get("user-agent") ?? null,
      } satisfies Json,
      updated_by: ctx.userId,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/processus/${id}`);
  return { ok: true };
}
