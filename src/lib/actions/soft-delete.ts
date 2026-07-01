import "server-only";

import { canWrite } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";
import type { ActionResult } from "./types";

/** Tables à suppression logique (colonne `deleted_at` + `tenant_id`). */
export type SoftDeletableTable =
  | "actions"
  | "communication_modeles"
  | "competences"
  | "competences_personnes"
  | "consultants"
  | "documents_maitrise"
  | "enquetes_satisfaction"
  | "evenements_qualite"
  | "fournisseurs"
  | "indicateurs"
  | "jalons_certification"
  | "modifications_smq"
  | "parties_interessees"
  | "pi_attentes"
  | "politique_engagements"
  | "procedures"
  | "processus"
  | "reunions"
  | "risques_opportunites"
  | "veille_reglementaire";

/**
 * Suppression logique (corbeille) générique.
 *
 * Exécutée via le client **service-role** : la policy SELECT de ces tables
 * filtre `deleted_at is null`, et PostgreSQL applique cette policy à la *nouvelle*
 * ligne lors d'un UPDATE. Faire passer `deleted_at` à une valeur avec le client
 * utilisateur est donc rejeté (« new row violates row-level security policy »).
 * Le service-role contourne la RLS ; comme il court-circuite aussi le trigger
 * auditeur, la garde de droits (`canWrite`) et le périmètre tenant sont imposés
 * ici, côté serveur.
 */
export async function softDeleteRow(table: SoftDeletableTable, id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  // updated_by : tracé pour la main courante (le trigger d'audit s'en sert comme
  // auteur, auth.uid() étant null en service-role).
  const admin = createAdminClient();
  const { error } = await admin
    .from(table)
    .update({ deleted_at: new Date().toISOString(), updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Restauration depuis la corbeille (inverse de `softDeleteRow`) : remet
 * `deleted_at = null` pour faire réapparaître l'élément dans les listes.
 *
 * Même contournement RLS que pour la suppression (client service-role) : la
 * policy SELECT filtrant `deleted_at is null`, le client utilisateur ne « voit »
 * pas la ligne en corbeille et ne peut donc pas la mettre à jour. Les gardes
 * (client actif, droits d'écriture, périmètre tenant) sont imposées ici, côté
 * serveur - l'auditeur (lecture seule) ne peut donc pas restaurer.
 */
export async function restoreRow(table: SoftDeletableTable, id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const admin = createAdminClient();
  const { error } = await admin
    .from(table)
    .update({ deleted_at: null, updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
