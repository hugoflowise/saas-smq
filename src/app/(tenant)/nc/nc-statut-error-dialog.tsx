"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions/types";

/**
 * Erreur de verrou d'efficacité (§10.2) : on la repère de façon robuste sur le
 * libellé renvoyé par les server actions NC (cf. src/lib/actions/nc.ts).
 */
function estErreurEfficacite(error: string | undefined): error is string {
  if (!error) return false;
  const e = error.toLowerCase();
  return e.includes("efficacité") || e.includes("verdict");
}

/**
 * Comportement mutualisé entre les 3 chemins de changement de statut NC
 * (kanban, cellules inline, dialogue). Une erreur de verrou d'efficacité doit
 * être affichée dans une modale centrale bloquante (« J'ai compris ») plutôt
 * qu'en toast discret ; les autres erreurs restent en toast.
 *
 * @example
 * const { handleStatutError, dialog } = useNcStatutError();
 * const r = await setNcStatutAction(...);
 * if (!r.ok) handleStatutError(r);
 * // …puis rendre `{dialog}` dans le composant.
 */
export function useNcStatutError() {
  const [message, setMessage] = useState<string | null>(null);

  /**
   * Traite un `ActionResult` en échec.
   * @returns `true` si l'erreur a été prise en charge par la modale centrale,
   *          `false` si elle a été affichée en toast (erreur générique).
   */
  function handleStatutError(result: ActionResult): boolean {
    if (result.ok) return false;
    if (estErreurEfficacite(result.error)) {
      setMessage(result.error);
      return true;
    }
    toast.error(result.error);
    return false;
  }

  const dialog = (
    <Dialog open={message !== null} onOpenChange={(o) => !o && setMessage(null)}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-status-nc-mineure" />
            Clôture impossible
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm">{message}</p>
        <Button type="button" className="w-full" onClick={() => setMessage(null)}>
          J'ai compris
        </Button>
      </DialogContent>
    </Dialog>
  );

  return { handleStatutError, dialog };
}
