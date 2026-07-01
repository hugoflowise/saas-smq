import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Module métier ISO 9001 (satisfaction client) : inaccessible par URL directe
// pour un client dont la formule ne couvre pas le 9001.
export default async function SuiviPrestationLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/suivi-prestation");
  return children;
}
