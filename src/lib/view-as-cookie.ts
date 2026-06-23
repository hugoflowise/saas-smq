import { cookies } from "next/headers";
import { estSimulable, type RoleSimulable } from "./view-as";

const COOKIE_NAME = "view_as_role";

/** Rôle actuellement simulé (cookie), ou null si l'admin est en vue normale. */
export async function getSimulatedRole(): Promise<RoleSimulable | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return estSimulable(value) ? value : null;
}

/** Définit (ou efface) le rôle simulé. À appeler depuis une Server Action. */
export async function setSimulatedRole(role: RoleSimulable | null): Promise<void> {
  const store = await cookies();
  if (role === null) {
    store.delete(COOKIE_NAME);
    return;
  }
  store.set(COOKIE_NAME, role, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
}
