import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (approche processus §4.4) : masqué/inaccessible pour un client MASE seul.
export default async function ProcessusLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/processus");
  return children;
}
