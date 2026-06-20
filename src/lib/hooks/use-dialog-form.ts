"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/types";

/**
 * Cycle de vie commun aux dialogues de formulaire (création / modification).
 *
 * Centralise ce que chaque dialogue répétait à l'identique :
 * - l'état d'ouverture (`open` / `setOpen`) ;
 * - l'état « en cours d'enregistrement » (`pending`) pour désactiver le bouton ;
 * - la soumission : empêche le rechargement, appelle la server action, affiche un
 *   toast de succès ou d'erreur, ferme le dialogue et rafraîchit la page (`router.refresh()`).
 *
 * La construction des données (extraction du `FormData`) et le choix de l'action
 * (créer vs modifier) restent dans le composant, car ils sont propres à chaque dialogue.
 *
 * @example
 * const { open, setOpen, pending, submit } = useDialogForm();
 *
 * function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 *   submit(e, {
 *     action: (f) => {
 *       const data = { intitule: f.get("intitule") };
 *       return isEdit ? updateXAction({ id, ...data }) : createXAction(data);
 *     },
 *     success: isEdit ? "Mis à jour." : "Créé.",
 *   });
 * }
 */
export function useDialogForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  /**
   * Gère la soumission d'un `<form>`.
   * @param event   l'événement de soumission du formulaire ;
   * @param options.action  reçoit le `FormData` et renvoie le résultat de la server action ;
   * @param options.success message du toast affiché en cas de succès.
   */
  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    options: {
      action: (formData: FormData) => Promise<ActionResult>;
      success: string;
    },
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await options.action(formData);
      if (result.ok) {
        toast.success(options.success);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setPending(false);
    }
  }

  return { open, setOpen, pending, submit };
}
