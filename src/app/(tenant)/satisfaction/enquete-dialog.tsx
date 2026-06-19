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
import { createEnqueteAction, updateEnqueteAction } from "@/lib/actions/satisfaction";

export type EnqueteRow = {
  id: string;
  client: string | null;
  date_reponse: string;
  note_recommandation: number | null;
  note_satisfaction: number | null;
  commentaire: string | null;
  est_reclamation: boolean;
  source: string | null;
};

export function EnqueteDialog({ enquete }: { enquete?: EnqueteRow }) {
  const router = useRouter();
  const isEdit = Boolean(enquete);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      client: f.get("client") || undefined,
      dateReponse: f.get("dateReponse") || undefined,
      noteRecommandation: f.get("noteRecommandation") || undefined,
      noteSatisfaction: f.get("noteSatisfaction") || undefined,
      commentaire: f.get("commentaire") || undefined,
      estReclamation: f.get("estReclamation") === "on",
      source: f.get("source") || undefined,
    };
    const result = isEdit
      ? await updateEnqueteAction({ id: enquete?.id, ...data })
      : await createEnqueteAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Réponse mise à jour." : "Réponse ajoutée.");
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
            <Button>Ajouter une réponse</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la réponse" : "Nouvelle réponse"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" name="client" defaultValue={enquete?.client ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateReponse">Date</Label>
              <Input
                id="dateReponse"
                name="dateReponse"
                type="date"
                defaultValue={enquete?.date_reponse ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="noteRecommandation">Recommandation (0-10, NPS)</Label>
              <Input
                id="noteRecommandation"
                name="noteRecommandation"
                type="number"
                min={0}
                max={10}
                defaultValue={enquete?.note_recommandation ?? ""}
                placeholder="0 à 10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="noteSatisfaction">Satisfaction (/10)</Label>
              <Input
                id="noteSatisfaction"
                name="noteSatisfaction"
                type="number"
                min={0}
                max={10}
                step="0.5"
                defaultValue={enquete?.note_satisfaction ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                defaultValue={enquete?.source ?? ""}
                placeholder="Suivi de projet, MS Forms…"
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="estReclamation"
                defaultChecked={enquete?.est_reclamation ?? false}
                className="size-4"
              />
              Réclamation / insatisfaction
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={3}
              defaultValue={enquete?.commentaire ?? ""}
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
