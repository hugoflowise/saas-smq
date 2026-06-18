"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  const supabase = await createClient();
  return { supabase, tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

// ---------------------------------------------------------------- Réclamations
const recBase = {
  objet: z.string().trim().min(2, "Objet requis."),
  client: z.string().trim().optional(),
  dateReception: z.string().optional(),
  canal: z.enum(["mail", "tel", "visio", "audit", "enquete", "autre"]),
  gravite: z.enum(["mineure", "majeure", "critique"]),
  description: z.string().trim().optional(),
  traitement: z.string().trim().optional(),
  statut: z.enum(["recue", "analysee", "traitee", "cloturee"]),
};
const recCreate = z.object(recBase);
const recUpdate = z.object({ id: z.string().uuid(), ...recBase });

function recPayload(d: z.infer<typeof recCreate>) {
  return {
    objet: d.objet,
    client: d.client ?? null,
    date_reception: d.dateReception || new Date().toISOString().slice(0, 10),
    canal: d.canal,
    gravite: d.gravite,
    description: d.description ?? null,
    traitement: d.traitement ?? null,
    statut: d.statut,
  };
}

export async function createReclamationAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = recCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("reclamations")
    .insert({ tenant_id: c.tenantId, ...recPayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/reclamations");
  return { ok: true };
}

export async function updateReclamationAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = recUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("reclamations")
    .update({ ...recPayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/reclamations");
  return { ok: true };
}

// ------------------------------------------------------------------- Veille
const veilleBase = {
  intitule: z.string().trim().min(2, "Intitulé requis."),
  reference: z.string().trim().optional(),
  domaine: z.enum(["travail", "qualite", "environnement", "securite", "rgpd", "autre"]),
  datePublication: z.string().optional(),
  dateApplication: z.string().optional(),
  impactSmq: z.string().trim().optional(),
  actionsAPrevoir: z.string().trim().optional(),
  statut: z.enum(["a_analyser", "analysee", "integree", "sans_objet"]),
};
const veilleCreate = z.object(veilleBase);
const veilleUpdate = z.object({ id: z.string().uuid(), ...veilleBase });

function veillePayload(d: z.infer<typeof veilleCreate>) {
  return {
    intitule: d.intitule,
    reference: d.reference ?? null,
    domaine: d.domaine,
    date_publication: d.datePublication || null,
    date_application: d.dateApplication || null,
    impact_smq: d.impactSmq ?? null,
    actions_a_prevoir: d.actionsAPrevoir ?? null,
    statut: d.statut,
  };
}

export async function createVeilleAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = veilleCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("veille_reglementaire")
    .insert({ tenant_id: c.tenantId, ...veillePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/veille");
  return { ok: true };
}

export async function updateVeilleAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = veilleUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("veille_reglementaire")
    .update({ ...veillePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/veille");
  return { ok: true };
}

// ----------------------------------------------------------------- Objectifs
const objBase = {
  intitule: z.string().trim().min(2, "Intitulé requis."),
  description: z.string().trim().optional(),
  estSmart: z.coerce.boolean().optional(),
  cibleChiffree: z.string().trim().optional(),
  echeance: z.string().optional(),
  fonctionConcernee: z.string().trim().optional(),
  statut: z.enum(["actif", "atteint", "abandonne"]),
  valeurCible: z.coerce.number().optional(),
  valeurActuelle: z.coerce.number().optional(),
  unite: z.string().trim().optional(),
  sens: z.enum(["hausse", "baisse"]).optional(),
  processusId: z.string().uuid().optional(),
};
const objCreate = z.object(objBase);
const objUpdate = z.object({ id: z.string().uuid(), ...objBase });

function objPayload(d: z.infer<typeof objCreate>) {
  return {
    intitule: d.intitule,
    description: d.description ?? null,
    est_smart: d.estSmart ?? false,
    cible_chiffree: d.cibleChiffree ?? null,
    echeance: d.echeance || null,
    fonction_concernee: d.fonctionConcernee ?? null,
    statut: d.statut,
    valeur_cible: d.valeurCible ?? null,
    valeur_actuelle: d.valeurActuelle ?? null,
    unite: d.unite ?? null,
    sens: d.sens ?? "hausse",
    processus_id: d.processusId ?? null,
  };
}

export async function createObjectifAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = objCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("objectifs_qualite")
    .insert({ tenant_id: c.tenantId, ...objPayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}

export async function updateObjectifAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = objUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("objectifs_qualite")
    .update({ ...objPayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}
