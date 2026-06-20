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
import { createPartieAction, updatePartieAction } from "@/lib/actions/parties-prenantes";
import {
  PRIORITE_CLASS,
  PRIORITE_LABELS,
  prioriteFromTotal,
  scoreTotal,
} from "@/lib/parties-prenantes";
import { SELECT_CLASS } from "@/lib/ui-classes";

const NOTE_OPTIONS = [
  { value: 1, label: "1 · Faible" },
  { value: 2, label: "2 · Moyen" },
  { value: 3, label: "3 · Fort" },
];

export type PartieRow = {
  id: string;
  nom: string;
  sphere: string;
  type: string;
  niveau_interaction: string;
  pouvoir: number;
  legitimite: number;
  urgence: number;
};

export function PartieDialog({ partie }: { partie?: PartieRow }) {
  const router = useRouter();
  const isEdit = Boolean(partie);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [pouvoir, setPouvoir] = useState(partie?.pouvoir ?? 2);
  const [legitimite, setLegitimite] = useState(partie?.legitimite ?? 2);
  const [urgence, setUrgence] = useState(partie?.urgence ?? 2);

  const total = scoreTotal(pouvoir, legitimite, urgence);
  const priorite = prioriteFromTotal(total);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      nom: f.get("nom"),
      sphere: f.get("sphere"),
      type: f.get("type"),
      niveauInteraction: f.get("niveauInteraction"),
      pouvoir,
      legitimite,
      urgence,
    };
    const result = isEdit
      ? await updatePartieAction({ id: partie?.id, ...data })
      : await createPartieAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Partie prenante mise à jour." : "Partie prenante créée.");
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
            <Button>Nouvelle partie prenante</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la partie prenante" : "Nouvelle partie prenante"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nom">Partie prenante</Label>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={partie?.nom ?? ""}
              placeholder="Dirigeants & associés, Clients, Autorité de contrôle…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sphere">Sphère</Label>
              <select
                id="sphere"
                name="sphere"
                className={SELECT_CLASS}
                defaultValue={partie?.sphere ?? "externe"}
              >
                <option value="interne">Interne (forte proximité)</option>
                <option value="externe">Externe</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Catégorie</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={partie?.type ?? "autre"}
              >
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
                <option value="collaborateur">Collaborateur</option>
                <option value="autorite">Autorité</option>
                <option value="actionnaire">Actionnaire</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="niveauInteraction">Interaction</Label>
              <select
                id="niveauInteraction"
                name="niveauInteraction"
                className={SELECT_CLASS}
                defaultValue={partie?.niveau_interaction ?? "moyenne"}
              >
                <option value="faible">Faible</option>
                <option value="moyenne">Moyenne</option>
                <option value="forte">Forte</option>
                <option value="elevee">Élevée</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pouvoir">Pouvoir</Label>
              <select
                id="pouvoir"
                className={SELECT_CLASS}
                value={pouvoir}
                onChange={(e) => setPouvoir(Number(e.target.value))}
              >
                {NOTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="legitimite">Légitimité</Label>
              <select
                id="legitimite"
                className={SELECT_CLASS}
                value={legitimite}
                onChange={(e) => setLegitimite(Number(e.target.value))}
              >
                {NOTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="urgence">Urgence</Label>
              <select
                id="urgence"
                className={SELECT_CLASS}
                value={urgence}
                onChange={(e) => setUrgence(Number(e.target.value))}
              >
                {NOTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Saillance calculée : <span className="font-semibold text-foreground">{total}</span> /
              5,25
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-medium text-xs ${PRIORITE_CLASS[priorite]}`}
            >
              Priorité {PRIORITE_LABELS[priorite]}
            </span>
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
