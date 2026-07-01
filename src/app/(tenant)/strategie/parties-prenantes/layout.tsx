import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (parties intéressées §4.2) : masqué/inaccessible pour un client MASE seul.
export default async function PartiesPrenantesLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/strategie/parties-prenantes");
  return children;
}
