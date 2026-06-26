"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions/types";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Bouton de suppression réutilisable. Ouvre une confirmation intégrée à l'app
 * (pas la boîte de dialogue native du navigateur) puis met l'élément à la
 * corbeille (soft-delete, réversible). Masqué pour les rôles en lecture seule
 * (auditeur). L'action serveur reçoit l'identifiant et renvoie un `ActionResult`.
 */
export function SupprimerButton({
  action,
  id,
  libelle = "cet élément",
  confirmText,
  successText = "Supprimé.",
  redirectTo,
  label = "Supprimer",
  iconOnly = false,
  variant = "ghost",
  className,
}: {
  action: (id: string) => Promise<ActionResult>;
  id: string;
  /** Nom de l'élément, pour le message de confirmation par défaut. */
  libelle?: string;
  confirmText?: string;
  successText?: string;
  /** Si fourni, redirige après suppression (ex. retour à la liste depuis un détail). */
  redirectTo?: string;
  label?: string;
  iconOnly?: boolean;
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function onConfirm() {
    setPending(true);
    const r = await action(id);
    setPending(false);
    if (r.ok) {
      setOpen(false);
      toast.success(successText);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size={iconOnly ? "icon" : "sm"}
            variant={variant}
            aria-label={iconOnly ? label : undefined}
            className={
              className ??
              (iconOnly
                ? "size-8 shrink-0 text-muted-foreground hover:text-destructive"
                : "h-8 shrink-0 gap-1.5 text-muted-foreground text-xs hover:text-destructive")
            }
          >
            <Trash2 className="size-3.5" />
            {iconOnly ? null : label}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            {confirmText ?? `Supprimer ${libelle} ? Il sera mis à la corbeille.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
