import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (modifications §6.3) : masqué/inaccessible pour un client MASE seul.
export default async function ModificationsSmqLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/modifications-smq");
  return children;
}
