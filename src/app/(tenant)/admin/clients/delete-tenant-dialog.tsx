"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTenantAction } from "@/lib/actions/tenants";

/**
 * Suppression réversible d'un client, avec sécurité : il faut retaper le nom
 * exact de la société pour activer le bouton.
 */
export function DeleteTenantDialog({
  tenantId,
  nomSociete,
}: {
  tenantId: string;
  nomSociete: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmNom, setConfirmNom] = useState("");
  const [pending, setPending] = useState(false);
  const match = confirmNom.trim() === nomSociete;

  async function handleDelete() {
    if (!match) return;
    setPending(true);
    const result = await deleteTenantAction({ tenantId, confirmNom: confirmNom.trim() });
    setPending(false);
    if (result.ok) {
      toast.success("Client mis à la corbeille.");
      setOpen(false);
      setConfirmNom("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Supprimer"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer ce client ?</DialogTitle>
          <DialogDescription>
            Le client est mis à la corbeille (réversible) : ses données sont conservées mais il
            n'apparaît plus dans la liste ni dans le sélecteur. Vous pourrez le restaurer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmNom">
            Pour confirmer, saisissez <span className="font-semibold">{nomSociete}</span>
          </Label>
          <Input
            id="confirmNom"
            value={confirmNom}
            autoComplete="off"
            placeholder={nomSociete}
            onChange={(e) => setConfirmNom(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={!match || pending} onClick={handleDelete}>
            {pending ? "Suppression…" : "Mettre à la corbeille"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
