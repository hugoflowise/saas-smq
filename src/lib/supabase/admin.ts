import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Supabase à privilèges élevés (service_role) · CONTOURNE les RLS.
 * Usage strictement serveur, pour les opérations d'administration Flowise
 * (création de comptes dirigeants, provisioning de tenant). Ne jamais
 * importer côté client : `server-only` casse le build si c'est le cas.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
