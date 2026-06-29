"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  // Id de la NC concernée : permet de proposer un bouton vers ses actions liées.
  const [ncId, setNcId] = useState<string | null>(null);

  /**
   * Traite un `ActionResult` en échec.
   * @param ncId id de la NC concernée (pour le bouton « Voir les actions liées »).
   * @returns `true` si l'erreur a été prise en charge par la modale centrale,
   *          `false` si elle a été affichée en toast (erreur générique).
   */
  function handleStatutError(result: ActionResult, ncId?: string): boolean {
    if (result.ok) return false;
    if (estErreurEfficacite(result.error)) {
      setMessage(result.error);
      setNcId(ncId ?? null);
      return true;
    }
    toast.error(result.error);
    return false;
  }

  function fermer() {
    setMessage(null);
    setNcId(null);
  }

  const dialog = (
    <Dialog open={message !== null} onOpenChange={(o) => !o && fermer()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-status-nc-mineure" />
            Clôture impossible
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm">{message}</p>
        <div className="flex flex-col gap-2">
          {ncId ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                router.push(`/nc/${ncId}`);
                fermer();
              }}
            >
              Voir les actions liées
            </Button>
          ) : null}
          <Button type="button" className="w-full" onClick={fermer}>
            J'ai compris
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { handleStatutError, dialog };
}
