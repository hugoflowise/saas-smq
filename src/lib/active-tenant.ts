import { cookies } from "next/headers";

const COOKIE_NAME = "active_tenant";

/** Identifiant du tenant actif (admin Flowise) lu depuis le cookie. */
export async function getActiveTenantId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/** Définit le tenant actif (à appeler depuis une Server Action / Route Handler). */
export async function setActiveTenantId(tenantId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, tenantId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}
