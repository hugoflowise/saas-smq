"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

// §4.3 : énoncé du périmètre + exclusions justifiées.
const exclusion = z.object({
  clause: z.string().trim(),
  intitule: z.string().trim(),
  justification: z.string().trim(),
});

const domaineSchema = z.object({
  perimetre: z.string().trim().optional(),
  sites: z.string().trim().optional(),
  exclusions: z.array(exclusion),
  dateEtablissement: z.string().optional(),
  prochaineRevue: z.string().optional(),
});

export async function saveDomaineAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = domaineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("domaine_application").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      perimetre: d.perimetre || null,
      sites: d.sites || null,
      exclusions: d.exclusions as Json,
      date_etablissement: d.dateEtablissement || null,
      prochaine_revue: d.prochaineRevue || null,
      updated_by: ctx.userId,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/domaine");
  return { ok: true };
}

/** Valide (ou retire la validation) du domaine d'application - preuve d'approbation direction. */
export async function validerDomaineAction(valider: boolean): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("domaine_application")
    .update({
      valide_par: valider ? ctx.userId : null,
      valide_le: valider ? new Date().toISOString() : null,
      updated_by: ctx.userId,
    })
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/domaine");
  return { ok: true };
}
