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
import { createObjectifAction, updateObjectifAction } from "@/lib/actions/registres";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ObjectifRow = {
  id: string;
  intitule: string;
  description: string | null;
  cible_chiffree: string | null;
  echeance: string | null;
  fonction_concernee: string | null;
  statut: string;
  valeur_cible: number | null;
  valeur_actuelle: number | null;
  unite: string | null;
  sens: string | null;
  processus_id: string | null;
  indicateur_id: string | null;
};

export function ObjectifDialog({
  objectif,
  processusOptions = [],
  indicateurOptions = [],
  presetProcessusId,
}: {
  objectif?: ObjectifRow;
  processusOptions?: { id: string; nom: string }[];
  indicateurOptions?: { id: string; nom: string }[];
  presetProcessusId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(objectif);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      intitule: f.get("intitule"),
      description: f.get("description") || undefined,
      echeance: f.get("echeance") || undefined,
      fonctionConcernee: f.get("fonctionConcernee") || undefined,
      statut: f.get("statut"),
      valeurCible: f.get("valeurCible") || undefined,
      valeurActuelle: f.get("valeurActuelle") || undefined,
      unite: f.get("unite") || undefined,
      sens: f.get("sens") || undefined,
      processusId: f.get("processusId") || undefined,
      indicateurId: f.get("indicateurId") || undefined,
    };
    const result = isEdit
      ? await updateObjectifAction({ id: objectif?.id, ...data })
      : await createObjectifAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Objectif mis à jour." : "Objectif créé.");
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
            <Button>Nouvel objectif</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'objectif" : "Nouvel objectif qualité"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé</Label>
            <Input id="intitule" name="intitule" required defaultValue={objectif?.intitule ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valeurActuelle">Valeur actuelle</Label>
              <Input
                id="valeurActuelle"
                name="valeurActuelle"
                type="number"
                step="any"
                defaultValue={objectif?.valeur_actuelle ?? ""}
                placeholder="65"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="valeurCible">Valeur cible</Label>
              <Input
                id="valeurCible"
                name="valeurCible"
                type="number"
                step="any"
                defaultValue={objectif?.valeur_cible ?? ""}
                placeholder="90"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unite">Unité</Label>
              <Input
                id="unite"
                name="unite"
                defaultValue={objectif?.unite ?? ""}
                placeholder="%, NPS, €…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sens">Sens</Label>
              <select
                id="sens"
                name="sens"
                className={SELECT_CLASS}
                defaultValue={objectif?.sens ?? "hausse"}
              >
                <option value="hausse">Hausse (atteindre la cible)</option>
                <option value="baisse">Baisse (ne pas dépasser)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus pilote</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                defaultValue={objectif?.processus_id ?? presetProcessusId ?? ""}
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
              <Label htmlFor="indicateurId">Indicateur de mesure</Label>
              <select
                id="indicateurId"
                name="indicateurId"
                className={SELECT_CLASS}
                defaultValue={objectif?.indicateur_id ?? ""}
              >
                <option value="">Aucun (saisie manuelle)</option>
                {indicateurOptions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="echeance">Échéance</Label>
              <Input
                id="echeance"
                name="echeance"
                type="date"
                defaultValue={objectif?.echeance ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fonctionConcernee">Fonction concernée</Label>
              <Input
                id="fonctionConcernee"
                name="fonctionConcernee"
                defaultValue={objectif?.fonction_concernee ?? ""}
                placeholder="BM, RH…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={objectif?.statut ?? "actif"}
              >
                <option value="actif">Actif</option>
                <option value="atteint">Atteint</option>
                <option value="abandonne">Abandonné</option>
              </select>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Si un indicateur de mesure est associé, la progression de l'objectif suit
            automatiquement sa dernière valeur mesurée (la saisie manuelle est ignorée).
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={objectif?.description ?? ""}
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
