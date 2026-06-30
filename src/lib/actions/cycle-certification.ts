"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const base = {
  libelle: z.string().trim().min(2, "Libellé requis."),
  type: z.enum(["audit_blanc", "audit_certification", "audit_surveillance", "revue", "autre"]),
  dateJalon: z.string().optional(),
  statut: z.enum(["planifie", "realise"]),
  description: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    libelle: d.libelle,
    type: d.type,
    date_jalon: d.dateJalon || null,
    statut: d.statut,
    description: d.description ?? null,
  };
}

export async function createJalonAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("jalons_certification")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendrier");
  return { ok: true };
}

export async function updateJalonAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("jalons_certification")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendrier");
  return { ok: true };
}

export async function deleteJalonAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("jalons_certification", id);
  if (r.ok) revalidatePath("/calendrier");
  return r;
}

/** Décale une date ISO (YYYY-MM-DD) de N mois et renvoie l'ISO. */
function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

const genererSchema = z.object({ dateCertification: z.string().min(1, "Date requise.") });

/**
 * Génère le cycle de certification type sur 3 ans à partir de la date de l'audit
 * de certification : audit blanc (−2 mois), certification, surveillances N+1/N+2,
 * renouvellement (N+3). Jalons proposés, librement éditables/supprimables ensuite.
 */
export async function genererCycleAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = genererSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const cert = parsed.data.dateCertification;
  const jalons = [
    { libelle: "Audit blanc", type: "audit_blanc" as const, date_jalon: addMonthsISO(cert, -2) },
    {
      libelle: "Audit de certification (étapes 1 et 2)",
      type: "audit_certification" as const,
      date_jalon: cert,
    },
    {
      libelle: "Audit de surveillance 1",
      type: "audit_surveillance" as const,
      date_jalon: addMonthsISO(cert, 12),
    },
    {
      libelle: "Audit de surveillance 2",
      type: "audit_surveillance" as const,
      date_jalon: addMonthsISO(cert, 24),
    },
    {
      libelle: "Audit de renouvellement",
      type: "audit_certification" as const,
      date_jalon: addMonthsISO(cert, 36),
    },
  ];
  const tenantId = ctx.effectiveTenantId;
  const userId = ctx.userId;
  const supabase = await createClient();
  const { error } = await supabase.from("jalons_certification").insert(
    jalons.map((j) => ({
      tenant_id: tenantId,
      ...j,
      statut: "planifie" as const,
      created_by: userId,
    })),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendrier");
  return { ok: true };
}
