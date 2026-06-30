"use client";

import { RotateCcw } from "lucide-react";
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
import { reinitialiserCycleAction } from "@/lib/actions/cycle-certification";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Réinitialise le cycle de certification : met à la corbeille tous les jalons
 * et les audits générés, pour pouvoir regénérer un cycle propre. Réservé aux
 * rôles écriture (masqué pour l'auditeur).
 */
export function ReinitialiserCycleButton() {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function onConfirm() {
    setPending(true);
    const r = await reinitialiserCycleAction();
    setPending(false);
    if (r.ok) {
      setOpen(false);
      toast.success("Cycle réinitialisé.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <RotateCcw className="size-4" />
            Réinitialiser le cycle
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réinitialiser le cycle de certification</DialogTitle>
          <DialogDescription>
            Tous les jalons et les audits générés par le cycle seront mis à la corbeille
            (réversible). Vous pourrez ensuite regénérer un cycle propre.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Réinitialisation…" : "Réinitialiser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
