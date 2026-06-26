"use client";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateRetourAction } from "@/lib/actions/retours";
import { RETOUR_STATUT_LABELS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

type Retour = {
  id: string;
  numero: number;
  type: string;
  titre: string;
  description: string | null;
  pageUrl: string | null;
  statut: keyof typeof RETOUR_STATUT_LABELS;
  noteAdmin: string | null;
  auteur: string;
  auteurEmail: string | null;
  client: string | null;
  date: string;
};

export function RetourDialog({ retour }: { retour: Retour }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await updateRetourAction({
      id: retour.id,
      statut: form.get("statut"),
      noteAdmin: form.get("noteAdmin") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Retour mis à jour.");
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
          <Button variant="outline" size="sm">
            Traiter
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <span className="font-mono text-muted-foreground">#{retour.numero}</span> {retour.titre}
          </DialogTitle>
          <DialogDescription>
            {retour.type} · {retour.auteur}
            {retour.auteurEmail ? ` (${retour.auteurEmail})` : ""}
            {retour.client ? ` · ${retour.client}` : ""} · {retour.date}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {retour.description ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="whitespace-pre-wrap">{retour.description}</p>
            </div>
          ) : null}
          {retour.pageUrl ? (
            <p className="text-muted-foreground text-xs">
              Page : <span className="font-mono">{retour.pageUrl}</span>
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="statut">Statut</Label>
            <select id="statut" name="statut" className={SELECT_CLASS} defaultValue={retour.statut}>
              {Object.entries(RETOUR_STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="noteAdmin">Note interne (facultatif)</Label>
            <Textarea
              id="noteAdmin"
              name="noteAdmin"
              rows={3}
              defaultValue={retour.noteAdmin ?? ""}
              placeholder="Décision, suite donnée, lien vers une PR…"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
