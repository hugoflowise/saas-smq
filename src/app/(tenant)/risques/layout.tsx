import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Tronc ISO Annexe SL (R&O stratégiques §6.1, ≠ AdR MASE) : masqué/inaccessible pour un client MASE seul.
export default async function RisquesLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/risques");
  return children;
}
