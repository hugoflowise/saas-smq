import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (contexte §4.1) : masqué/inaccessible pour un client MASE seul.
export default async function ContexteLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/strategie/contexte");
  return children;
}
