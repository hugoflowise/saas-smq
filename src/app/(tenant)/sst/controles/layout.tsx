import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Module métier SST/MASE (Axe 4) : masqué/inaccessible pour un client qualité seul.
export default async function ControlesLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/sst/controles");
  return children;
}
