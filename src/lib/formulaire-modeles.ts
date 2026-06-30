import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectionConfig } from "@/lib/suivi-consultant";
import { SUIVI_CONSULTANT_SECTIONS } from "@/lib/suivi-consultant";
import type { Database } from "@/lib/supabase/database.types";

/** Formulaires de suivi personnalisables par client. */
export type FormulaireType = "suivi_consultant" | "suivi_prestation";

/**
 * Modèle par défaut (codé en TS) de chaque formulaire. Sert de référence tant
 * qu'un client n'a pas personnalisé son formulaire : aucune ligne n'est alors
 * créée dans `formulaire_modeles`, et c'est ce modèle qui est rendu.
 * (`suivi_prestation` sera branché en Phase 3, avec le type de champ « matrice ».)
 */
export const MODELES_PAR_DEFAUT: Record<FormulaireType, SectionConfig[]> = {
  suivi_consultant: SUIVI_CONSULTANT_SECTIONS,
  suivi_prestation: [],
};

export type DefinitionResolue = {
  sections: SectionConfig[];
  /** Version du modèle personnalisé, ou `null` si on retombe sur le défaut TS. */
  version: number | null;
};

/**
 * Résout la définition de formulaire à utiliser pour un client : le modèle
 * personnalisé actif s'il existe, sinon le modèle par défaut codé en TS.
 * Fonctionne avec n'importe quel client Supabase (admin service-role pour les
 * pages publiques, client authentifié pour les pages internes).
 */
export async function resoudreDefinitionFormulaire(
  client: SupabaseClient<Database>,
  tenantId: string,
  type: FormulaireType,
): Promise<DefinitionResolue> {
  const { data } = await client
    .from("formulaire_modeles")
    .select("definition, version")
    .eq("tenant_id", tenantId)
    .eq("type", type)
    .eq("actif", true)
    .maybeSingle();

  if (data?.definition) {
    return {
      sections: data.definition as unknown as SectionConfig[],
      version: data.version,
    };
  }

  return { sections: MODELES_PAR_DEFAUT[type], version: null };
}
