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
import { createNcAction, updateNcAction } from "@/lib/actions/nc";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import {
  NC_GRAVITE_LABELS,
  NC_ORIGINE_LABELS,
  NC_STATUT_LABELS,
  NC_TYPE_LABELS,
} from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type NcRow = {
  id: string;
  intitule: string;
  description: string | null;
  date_constat: string;
  origine: string;
  gravite: string;
  type: string;
  statut: string;
  processus_concerne: string | null;
};

function Opts({ map }: { map: Record<string, string> }) {
  return (
    <>
      {Object.entries(map).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </>
  );
}

export function NcDialog({
  processusOptions,
  nc,
  presetProcessusId,
}: {
  processusOptions: { id: string; nom: string }[];
  nc?: NcRow;
  presetProcessusId?: string;
}) {
  const isEdit = Boolean(nc);
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) => {
        const payload = {
          intitule: form.get("intitule"),
          description: form.get("description") || undefined,
          dateConstat: form.get("dateConstat") || undefined,
          origine: form.get("origine"),
          gravite: form.get("gravite"),
          type: form.get("type"),
          statut: form.get("statut"),
          processusConcerne: form.get("processusConcerne") || undefined,
        };
        return isEdit ? updateNcAction({ id: nc?.id, ...payload }) : createNcAction(payload);
      },
      success: isEdit ? "Non-conformité mise à jour." : "Non-conformité créée.",
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
            <Button>Nouvelle non-conformité</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la non-conformité" : "Nouvelle non-conformité"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé</Label>
            <Input id="intitule" name="intitule" required defaultValue={nc?.intitule ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={nc?.statut ?? "ouverte"}
              >
                <Opts map={NC_STATUT_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gravite">Gravité</Label>
              <select
                id="gravite"
                name="gravite"
                className={SELECT_CLASS}
                defaultValue={nc?.gravite ?? "mineure"}
              >
                <Opts map={NC_GRAVITE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={nc?.type ?? "nc_processus"}
              >
                <Opts map={NC_TYPE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="origine">Origine</Label>
              <select
                id="origine"
                name="origine"
                className={SELECT_CLASS}
                defaultValue={nc?.origine ?? "autre"}
              >
                <Opts map={NC_ORIGINE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusConcerne">Processus</Label>
              <select
                id="processusConcerne"
                name="processusConcerne"
                className={SELECT_CLASS}
                defaultValue={nc?.processus_concerne ?? presetProcessusId ?? ""}
              >
                <option value="">—</option>
                {processusOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateConstat">Date de constat</Label>
              <Input
                id="dateConstat"
                name="dateConstat"
                type="date"
                defaultValue={nc?.date_constat ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={nc?.description ?? ""}
            />
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
