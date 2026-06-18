"use client";

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
import { createIndicateurAction } from "@/lib/actions/indicateurs";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateIndicateurDialog({
  processusOptions,
}: {
  processusOptions: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await createIndicateurAction({
      nom: form.get("nom"),
      description: form.get("description") || undefined,
      processusId: form.get("processusId") || undefined,
      type: form.get("type"),
      unite: form.get("unite") || undefined,
      cible: form.get("cible") || undefined,
      seuilMin: form.get("seuilMin") || undefined,
      seuilMax: form.get("seuilMax") || undefined,
      frequence: form.get("frequence"),
    });
    setPending(false);
    if (result.ok) {
      toast.success("Indicateur créé.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouvel indicateur</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel indicateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" required placeholder="Taux de satisfaction client" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" className={SELECT_CLASS} defaultValue="percentage">
                <option value="numeric">Numérique</option>
                <option value="percentage">Pourcentage</option>
                <option value="count">Nombre</option>
                <option value="duration">Durée</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unite">Unité</Label>
              <Input id="unite" name="unite" placeholder="%, jours, €…" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="frequence">Fréquence</Label>
              <select
                id="frequence"
                name="frequence"
                className={SELECT_CLASS}
                defaultValue="mensuel"
              >
                <option value="quotidien">Quotidienne</option>
                <option value="hebdo">Hebdomadaire</option>
                <option value="mensuel">Mensuelle</option>
                <option value="trimestriel">Trimestrielle</option>
                <option value="annuel">Annuelle</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus</Label>
              <select id="processusId" name="processusId" className={SELECT_CLASS} defaultValue="">
                <option value="">— (global)</option>
                {processusOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cible">Cible</Label>
              <Input id="cible" name="cible" type="number" step="any" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="seuilMin">Seuil min</Label>
                <Input id="seuilMin" name="seuilMin" type="number" step="any" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="seuilMax">Seuil max</Label>
                <Input id="seuilMax" name="seuilMax" type="number" step="any" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Création…" : "Créer l'indicateur"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
