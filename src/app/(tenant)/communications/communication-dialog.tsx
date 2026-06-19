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
import { createCommunicationAction, updateCommunicationAction } from "@/lib/actions/communications";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const TYPE_LABELS: Record<string, string> = {
  note_interne: "Note interne",
  communique: "Communiqué externe",
  affichage: "Affichage",
  reunion: "Réunion",
  newsletter: "Newsletter",
  autre: "Autre",
};
export const CANAL_LABELS: Record<string, string> = {
  email: "E-mail",
  intranet: "Intranet",
  affichage: "Affichage",
  reunion: "Réunion",
  courrier: "Courrier",
  autre: "Autre",
};

export type CommunicationRow = {
  id: string;
  sujet: string;
  type: string;
  canal: string;
  audience: string | null;
  message: string | null;
  date_prevue: string | null;
  date_realisee: string | null;
  statut: string;
};

function Options({ map }: { map: Record<string, string> }) {
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

export function CommunicationDialog({ communication }: { communication?: CommunicationRow }) {
  const router = useRouter();
  const isEdit = Boolean(communication);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      sujet: f.get("sujet"),
      type: f.get("type"),
      canal: f.get("canal"),
      audience: f.get("audience") || undefined,
      message: f.get("message") || undefined,
      datePrevue: f.get("datePrevue") || undefined,
      dateRealisee: f.get("dateRealisee") || undefined,
      statut: f.get("statut"),
    };
    const result = isEdit
      ? await updateCommunicationAction({ id: communication?.id, ...data })
      : await createCommunicationAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Communication mise à jour." : "Communication créée.");
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
            <Button>Nouvelle communication</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la communication" : "Nouvelle communication"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sujet">Sujet</Label>
            <Input
              id="sujet"
              name="sujet"
              required
              defaultValue={communication?.sujet ?? ""}
              placeholder="Lancement de la démarche ISO 9001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={communication?.type ?? "note_interne"}
              >
                <Options map={TYPE_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="canal">Canal</Label>
              <select
                id="canal"
                name="canal"
                className={SELECT_CLASS}
                defaultValue={communication?.canal ?? "email"}
              >
                <Options map={CANAL_LABELS} />
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={communication?.statut ?? "planifiee"}
              >
                <option value="planifiee">Planifiée</option>
                <option value="realisee">Réalisée</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="audience">Audience</Label>
              <Input
                id="audience"
                name="audience"
                defaultValue={communication?.audience ?? ""}
                placeholder="Tout le personnel, clients…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePrevue">Date prévue</Label>
              <Input
                id="datePrevue"
                name="datePrevue"
                type="date"
                defaultValue={communication?.date_prevue ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateRealisee">Date réalisée</Label>
              <Input
                id="dateRealisee"
                name="dateRealisee"
                type="date"
                defaultValue={communication?.date_realisee ?? ""}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Message / contenu</Label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              defaultValue={communication?.message ?? ""}
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
