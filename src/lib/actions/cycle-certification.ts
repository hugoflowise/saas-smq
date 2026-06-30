"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const base = {
  libelle: z.string().trim().min(2, "Libellé requis."),
  type: z.enum([
    "audit_blanc",
    "audit_interne",
    "audit_certification",
    "audit_surveillance",
    "revue",
    "autre",
  ]),
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
 * de certification. Pour chaque audit externe (certification, surveillances N+1/N+2,
 * renouvellement N+3), on crée :
 *   - un **audit interne** planifié 2 mois avant (préparation, §9.2) ;
 *   - l'**audit externe** lui-même.
 * Chaque audit est matérialisé dans le module Audits (`audits_internes`) et chaque
 * jalon du cycle pointe dessus (`audit_id`) → tout est lié : le bouton « Voir
 * l'audit » ouvre la fiche, et l'audit apparaît dans le planning annuel.
 * Jalons et audits restent librement éditables/supprimables ensuite.
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
  const tenantId = ctx.effectiveTenantId;
  const userId = ctx.userId;
  const supabase = await createClient();

  // Les audits externes du cycle (certification + 3 contrôles de l'organisme).
  const externes = [
    { libelle: "Audit de certification", date: cert, type: "audit_certification" as const },
    {
      libelle: "Audit de surveillance 1",
      date: addMonthsISO(cert, 12),
      type: "audit_surveillance" as const,
    },
    {
      libelle: "Audit de surveillance 2",
      date: addMonthsISO(cert, 24),
      type: "audit_surveillance" as const,
    },
    {
      libelle: "Audit de renouvellement",
      date: addMonthsISO(cert, 36),
      type: "audit_certification" as const,
    },
  ];

  // Références incrémentales par préfixe (AI-AAAA-/AE-AAAA-), seedées depuis la
  // base au premier usage de chaque préfixe puis comptées localement.
  const refCounters = new Map<string, number>();
  async function nextRef(prefix: string): Promise<string> {
    if (!refCounters.has(prefix)) {
      const { count } = await supabase
        .from("audits_internes")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .ilike("reference", `${prefix}%`);
      refCounters.set(prefix, count ?? 0);
    }
    const n = (refCounters.get(prefix) ?? 0) + 1;
    refCounters.set(prefix, n);
    return `${prefix}${String(n).padStart(3, "0")}`;
  }

  // Crée un audit (interne/externe) et renvoie son id, pour rattacher le jalon.
  async function createAudit(
    typeAudit: "interne" | "externe",
    date: string,
    perimetre: string,
  ): Promise<string> {
    const prefix = `${typeAudit === "interne" ? "AI" : "AE"}-${date.slice(0, 4)}-`;
    const reference = await nextRef(prefix);
    const { data, error } = await supabase
      .from("audits_internes")
      .insert({
        tenant_id: tenantId,
        reference,
        type_audit: typeAudit,
        perimetre,
        date_prevue: date,
        statut: "planifie" as const,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Création de l'audit impossible.");
    return data.id;
  }

  type JalonInsert = {
    libelle: string;
    type: "audit_interne" | "audit_certification" | "audit_surveillance";
    date_jalon: string;
    audit_id: string;
  };
  const jalons: JalonInsert[] = [];

  try {
    for (const ext of externes) {
      // Audit interne préparatoire, 2 mois avant l'audit externe.
      const dateInterne = addMonthsISO(ext.date, -2);
      const auditInterneId = await createAudit(
        "interne",
        dateInterne,
        `Audit interne — préparation ${ext.libelle.toLowerCase()}`,
      );
      jalons.push({
        libelle: `Audit interne (préparation ${ext.libelle.toLowerCase()})`,
        type: "audit_interne",
        date_jalon: dateInterne,
        audit_id: auditInterneId,
      });

      // Audit externe (organisme certificateur).
      const auditExterneId = await createAudit("externe", ext.date, ext.libelle);
      jalons.push({
        libelle: ext.libelle,
        type: ext.type,
        date_jalon: ext.date,
        audit_id: auditExterneId,
      });
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Génération impossible." };
  }

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
  revalidatePath("/audits");
  return { ok: true };
}
