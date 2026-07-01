import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (non-conformités §10.2) : masqué/inaccessible pour un client MASE seul.
export default async function NcLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/nc");
  return children;
}
