"use client";

import { createContext, useContext } from "react";

/**
 * Indique si l'interface est en lecture seule pour l'utilisateur courant
 * (rôle auditeur, ou un admin qui prévisualise en auditeur). Fourni par le
 * layout tenant ; consommé par `useDialogForm` et les composants d'écriture
 * pour neutraliser/masquer les actions. La sécurité réelle reste en base.
 */
const ReadOnlyContext = createContext(false);

export function ReadOnlyProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return <ReadOnlyContext.Provider value={value}>{children}</ReadOnlyContext.Provider>;
}

export function useReadOnly(): boolean {
  return useContext(ReadOnlyContext);
}
