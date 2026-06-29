import { nomPersonne } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type TenantMember = { id: string; nom: string };

/**
 * Liste les membres (profils) d'un client, prêts à peupler un sélecteur
 * « responsable / auditeur / pilote ». Le nom affiché passe par
 * {@link nomPersonne} (jamais l'e-mail brut).
 */
export async function listTenantMembers(tenantId: string): Promise<TenantMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("tenant_id", tenantId)
    .order("full_name");
  return (data ?? []).map((u) => ({ id: u.id, nom: nomPersonne(u.full_name, u.email) }));
}
