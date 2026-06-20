"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJalonAction, updateJalonAction } from "@/lib/actions/cycle-certification";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export const JALON_TYPE_LABELS: Record<string, string> = {
  audit_blanc: "Audit blanc",
  audit_certification: "Audit de certification",
  audit_surveillance: "Audit de surveillance",
  revue: "Revue",
  autre: "Autre",
};

export type JalonRow = {
  id: string;
  libelle: string;
  type: string;
  date_jalon: string | null;
  statut: string;
  description: string | null;
};

export function JalonDialog({ jalon }: { jalon?: JalonRow }) {
  const isEdit = Boolean(jalon);
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          libelle: f.get("libelle"),
          type: f.get("type"),
          dateJalon: f.get("dateJalon") || undefined,
          statut: f.get("statut"),
          description: f.get("description") || undefined,
        };
        return isEdit ? updateJalonAction({ id: jalon?.id, ...data }) : createJalonAction(data);
      },
      success: isEdit ? "Jalon mis à jour." : "Jalon ajouté.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>Ajouter un jalon</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le jalon" : "Nouveau jalon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              name="libelle"
              required
              defaultValue={jalon?.libelle ?? ""}
              placeholder="Audit de certification · Stage 2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={jalon?.type ?? "audit_certification"}
              >
                {Object.entries(JALON_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={jalon?.statut ?? "planifie"}
              >
                <option value="planifie">Planifié</option>
                <option value="realise">Réalisé</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateJalon">Date</Label>
              <Input
                id="dateJalon"
                name="dateJalon"
                type="date"
                defaultValue={jalon?.date_jalon ?? ""}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={jalon?.description ?? ""}
              placeholder="Ex. 11 NC majeures identifiées · plan d'action lancé"
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
