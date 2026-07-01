import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (domaine d'application §4.3) : masqué/inaccessible pour un client MASE seul.
export default async function DomaineLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/strategie/domaine");
  return children;
}
