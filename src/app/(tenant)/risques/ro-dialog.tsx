"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
import { createRoAction, updateRoAction } from "@/lib/actions/risques";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type RoRow = {
  id: string;
  intitule: string;
  type: string;
  processus_id: string | null;
  cause: string | null;
  consequence: string | null;
  gravite: number;
  probabilite: number;
  gravite_residuelle: number | null;
  probabilite_residuelle: number | null;
  traitement_prevu: string | null;
  statut: string;
  date_revue: string | null;
};

export function RoDialog({
  processusOptions,
  ro,
  presetProcessusId,
}: {
  processusOptions: { id: string; nom: string }[];
  ro?: RoRow;
  presetProcessusId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(ro);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const data = {
      intitule: form.get("intitule"),
      type: form.get("type"),
      processusId: form.get("processusId") || undefined,
      cause: form.get("cause") || undefined,
      consequence: form.get("consequence") || undefined,
      gravite: form.get("gravite"),
      probabilite: form.get("probabilite"),
      graviteResiduelle: form.get("graviteResiduelle") || undefined,
      probabiliteResiduelle: form.get("probabiliteResiduelle") || undefined,
      traitementPrevu: form.get("traitementPrevu") || undefined,
      statut: form.get("statut"),
      dateRevue: form.get("dateRevue") || undefined,
    };
    const result = isEdit
      ? await updateRoAction({ id: ro?.id, ...data })
      : await createRoAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Risque/opportunité mis à jour." : "Risque/opportunité créé.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
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
            <Button>Nouveau risque / opportunité</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier" : "Nouveau risque / opportunité"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé</Label>
            <Input id="intitule" name="intitule" required defaultValue={ro?.intitule ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={ro?.type ?? "risque"}
              >
                <option value="risque">Risque</option>
                <option value="opportunite">Opportunité</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={ro?.statut ?? "identifie"}
              >
                <option value="identifie">Identifié</option>
                <option value="en_traitement">En traitement</option>
                <option value="maitrise">Maîtrisé</option>
                <option value="cloture">Clôturé</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gravite">Gravité (1-5)</Label>
              <select
                id="gravite"
                name="gravite"
                className={SELECT_CLASS}
                defaultValue={String(ro?.gravite ?? 1)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="probabilite">Probabilité (1-5)</Label>
              <select
                id="probabilite"
                name="probabilite"
                className={SELECT_CLASS}
                defaultValue={String(ro?.probabilite ?? 1)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="graviteResiduelle">Gravité résiduelle (après traitement)</Label>
              <select
                id="graviteResiduelle"
                name="graviteResiduelle"
                className={SELECT_CLASS}
                defaultValue={ro?.gravite_residuelle ? String(ro.gravite_residuelle) : ""}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="probabiliteResiduelle">Probabilité résiduelle</Label>
              <select
                id="probabiliteResiduelle"
                name="probabiliteResiduelle"
                className={SELECT_CLASS}
                defaultValue={ro?.probabilite_residuelle ? String(ro.probabilite_residuelle) : ""}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                defaultValue={ro?.processus_id ?? presetProcessusId ?? ""}
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
              <Label htmlFor="dateRevue">Date de revue</Label>
              <Input
                id="dateRevue"
                name="dateRevue"
                type="date"
                defaultValue={ro?.date_revue ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cause">Cause</Label>
            <Textarea id="cause" name="cause" rows={2} defaultValue={ro?.cause ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="consequence">Conséquence</Label>
            <Textarea
              id="consequence"
              name="consequence"
              rows={2}
              defaultValue={ro?.consequence ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="traitementPrevu">Traitement prévu</Label>
            <Textarea
              id="traitementPrevu"
              name="traitementPrevu"
              rows={2}
              defaultValue={ro?.traitement_prevu ?? ""}
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
