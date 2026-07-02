import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Module métier SST/MASE (Axe 3) : masqué/inaccessible pour un client qualité seul.
export default async function AnalysesRisquesLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/sst/analyses-risques");
  return children;
}
