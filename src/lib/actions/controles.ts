"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const BASE = "/sst/controles";

const schema = z.object({
  intitule: z.string().trim().min(2, "Intitulé requis."),
  equipement: z.string().trim().optional(),
  organisme: z.string().trim().optional(),
  domaine: z.enum(["securite", "sante", "environnement"]).optional(),
  periodiciteMois: z.coerce.number().int().positive().optional(),
  dateDernier: z.string().optional(),
  dateProchain: z.string().optional(),
  statut: z.enum(["a_planifier", "conforme", "non_conforme"]),
  reference: z.string().trim().optional(),
  observations: z.string().trim().optional(),
});

/** Ajoute `mois` mois à une date ISO (YYYY-MM-DD) et renvoie l'ISO résultante. */
function ajouterMois(dateISO: string, mois: number): string | null {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  const base = new Date(Date.UTC(y, m - 1 + mois, d));
  return base.toISOString().slice(0, 10);
}

function normalize(d: z.infer<typeof schema>) {
  // Échéance déduite du dernier contrôle + périodicité si non saisie explicitement.
  let dateProchain = d.dateProchain || null;
  if (!dateProchain && d.dateDernier && d.periodiciteMois) {
    dateProchain = ajouterMois(d.dateDernier, d.periodiciteMois);
  }
  return {
    intitule: d.intitule,
    equipement: d.equipement || null,
    organisme: d.organisme || null,
    domaine: d.domaine ?? null,
    periodicite_mois: d.periodiciteMois ?? null,
    date_dernier: d.dateDernier || null,
    date_prochain: dateProchain,
    statut: d.statut,
    reference: d.reference || null,
    observations: d.observations || null,
  };
}

export async function createControleAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("controles_obligatoires")
    .insert({ tenant_id: ctx.effectiveTenantId, ...normalize(parsed.data), created_by: ctx.userId })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath(BASE);
  return { ok: true, id: data.id };
}

const updateSchema = schema.extend({ id: z.string().uuid() });

export async function updateControleAction(input: unknown): Promise<ActionResult> {
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
    .from("controles_obligatoires")
    .update({ ...normalize(rest), updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(BASE);
  return { ok: true };
}

export async function deleteControleAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("controles_obligatoires", id);
  if (r.ok) revalidatePath(BASE);
  return r;
}
