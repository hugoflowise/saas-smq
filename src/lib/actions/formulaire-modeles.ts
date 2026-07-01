"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { type FormulaireType, MODELES_PAR_DEFAUT } from "@/lib/formulaire-modeles";
import { canWrite } from "@/lib/permissions";
import type { Champ, SectionConfig } from "@/lib/suivi-consultant";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { getTenantContext } from "@/lib/tenant-context";

const champSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1, "Chaque question doit avoir un libellé."),
  type: z.enum(["text", "email", "textarea", "date", "single", "multi", "note5", "nps", "matrice"]),
  required: z.boolean().optional(),
  options: z.array(z.string().trim()).optional(),
  allowAutre: z.boolean().optional(),
  showIf: z.object({ key: z.string(), equals: z.string() }).optional(),
  verrou: z.boolean().optional(),
  roleStat: z.string().optional(),
  // Type « matrice » (socle uniquement) : re-stampé depuis le modèle par défaut.
  lignes: z.array(z.object({ key: z.string(), label: z.string() })).optional(),
  echelle: z
    .object({
      min: z.number(),
      max: z.number(),
      labels: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

const sectionSchema = z.object({
  title: z.string().trim().min(1, "Chaque section doit avoir un titre."),
  champs: z.array(champSchema),
});

const saveSchema = z.object({
  type: z.enum(["suivi_consultant", "suivi_prestation"]),
  definition: z.array(sectionSchema).min(1, "Au moins une section est requise."),
});

/** Champs socle (verrouillés) du modèle par défaut, indexés par clé. */
function socleParDefaut(type: FormulaireType): Map<string, Champ> {
  const map = new Map<string, Champ>();
  for (const section of MODELES_PAR_DEFAUT[type]) {
    for (const c of section.champs) {
      if (c.verrou) map.set(c.key, c);
    }
  }
  return map;
}

/**
 * Enregistre la définition personnalisée d'un formulaire pour le client actif.
 *
 * Garde-fous (intégrité des indicateurs) :
 *  - toutes les questions socle (verrouillées) du modèle par défaut doivent être
 *    présentes ; sinon la sauvegarde est refusée ;
 *  - sur ces questions socle, on ré-imprime côté serveur `verrou`, `roleStat`,
 *    `type` et `options` depuis le modèle par défaut : le client peut reformuler
 *    le libellé et réordonner, mais ne peut ni déverrouiller, ni changer le type,
 *    ni altérer les options (qui pilotent l'extraction des stats / alertes).
 *
 * Versionnement : on désactive le modèle actif courant et on insère une nouvelle
 * version active (les suivis déjà soumis gardent leur `modele_version`).
 */
export async function saveFormulaireModeleAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { type, definition } = parsed.data;
  const tenantId = ctx.effectiveTenantId;

  // Détection préalable des clés dupliquées (ne devrait pas arriver via l'UI).
  const toutesCles = definition.flatMap((s) => s.champs.map((c) => c.key));
  if (new Set(toutesCles).size !== toutesCles.length) {
    return { ok: false, error: "Deux questions partagent la même clé. Rechargez la page." };
  }

  // Re-stampage des champs socle (libellé + position au client, reste verrouillé).
  const socle = socleParDefaut(type);
  const vues = new Set(toutesCles);
  const sections: SectionConfig[] = definition.map((s, i) => ({
    n: i + 1,
    title: s.title,
    champs: s.champs.map((c) => {
      const ref = socle.get(c.key);
      if (ref) {
        return { ...ref, label: c.label, required: ref.required, showIf: ref.showIf };
      }
      return c as Champ;
    }),
  }));

  // Toutes les questions socle doivent rester présentes.
  for (const key of socle.keys()) {
    if (!vues.has(key)) {
      return {
        ok: false,
        error: "Une question essentielle (verrouillée) a été retirée. Rechargez la page.",
      };
    }
  }

  const admin = createAdminClient();

  // Plus haute version connue (active ou archivée) pour incrémenter sans collision.
  const { data: derniere } = await admin
    .from("formulaire_modeles")
    .select("version")
    .eq("tenant_id", tenantId)
    .eq("type", type)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Désactivation du modèle actif courant (un seul actif par tenant+type).
  await admin
    .from("formulaire_modeles")
    .update({ actif: false })
    .eq("tenant_id", tenantId)
    .eq("type", type)
    .eq("actif", true);

  // Normalisation (évite tout souci de prototype nul venant du client).
  const definitionJson = JSON.parse(JSON.stringify(sections)) as Json;

  const { error } = await admin.from("formulaire_modeles").insert({
    tenant_id: tenantId,
    type,
    version: (derniere?.version ?? 0) + 1,
    definition: definitionJson,
    actif: true,
  });
  if (error) return { ok: false, error: error.message };

  revaliderFormulaire(type);
  return { ok: true };
}

/** Revalide les pages liées au type de formulaire (liste + éditeur). */
function revaliderFormulaire(type: FormulaireType): void {
  const base = type === "suivi_prestation" ? "/suivi-prestation" : "/suivi-consultant";
  revalidatePath(base);
  revalidatePath(`${base}/formulaire`);
}

/** Réinitialise le formulaire au modèle standard (désactive toute personnalisation). */
export async function resetFormulaireModeleAction(type: FormulaireType): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("formulaire_modeles")
    .update({ actif: false })
    .eq("tenant_id", ctx.effectiveTenantId)
    .eq("type", type)
    .eq("actif", true);
  if (error) return { ok: false, error: error.message };

  revaliderFormulaire(type);
  return { ok: true };
}
