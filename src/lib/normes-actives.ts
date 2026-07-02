import { redirect } from "next/navigation";
import { isModuleVisible } from "./modules";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import { getTenantContext } from "./tenant-context";

// Normes par défaut : tout client existant est au moins en ISO 9001 (cf. migration
// `normes_actives`). Sert de repli tant qu'aucun tenant n'est résolu.
const DEFAUT: string[] = ["9001"];

/**
 * Référentiels actifs du client courant (source unique, réutilisée par le layout
 * et le garde de route). Un admin Flowise lit le tenant actif via le service-role
 * (le tenant choisi n'est pas le sien → hors RLS) ; un dirigeant/manager lit son
 * propre tenant sous RLS.
 */
export async function getNormesActives(): Promise<string[]> {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) return DEFAUT;

  const db = ctx.realIsAdmin ? createAdminClient() : await createClient();
  const { data } = await db
    .from("tenants")
    .select("normes_actives")
    .eq("id", ctx.effectiveTenantId)
    .maybeSingle();

  return data?.normes_actives ?? DEFAUT;
}

/**
 * Garde de route : à appeler en tête d'une page/layout de module métier gaté.
 * Redirige vers le tableau de bord si le module n'est pas couvert par les normes
 * du client (défense en profondeur : le masquage du menu ne suffit pas, la page
 * reste sinon accessible par URL directe).
 */
export async function guardModuleAccess(href: string): Promise<void> {
  const normes = await getNormesActives();
  if (!isModuleVisible(href, normes)) redirect("/dashboard");
}
