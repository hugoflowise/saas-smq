import type { ReactNode } from "react";
import { guardModuleAccess } from "@/lib/normes-actives";

// Module métier ISO 9001 (achats / fournisseurs §8.4) : inaccessible par URL
// directe pour un client dont la formule ne couvre pas le 9001.
export default async function FournisseursLayout({ children }: { children: ReactNode }) {
  await guardModuleAccess("/fournisseurs");
  return children;
}
