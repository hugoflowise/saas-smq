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
import { Textarea } from "@/components/ui/textarea";
import { createProcedureAction } from "@/lib/actions/procedures";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateProcedureDialog({
  processusOptions,
  presetProcessusId,
}: {
  processusOptions: { id: string; nom: string }[];
  presetProcessusId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await createProcedureAction({
      titre: form.get("titre"),
      processusId: form.get("processusId") || undefined,
      descriptionCourte: form.get("descriptionCourte") || undefined,
      referenceIso: form.get("referenceIso") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Procédure créée.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouvelle procédure</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle procédure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" name="titre" required placeholder="Procédure de mise en mission" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="processusId">Processus associé</Label>
            <select
              id="processusId"
              name="processusId"
              className={SELECT_CLASS}
              defaultValue={presetProcessusId ?? ""}
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
            <Label htmlFor="referenceIso">Références ISO (séparées par des virgules)</Label>
            <Input id="referenceIso" name="referenceIso" placeholder="7.5, 8.4.1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descriptionCourte">Description courte</Label>
            <Textarea id="descriptionCourte" name="descriptionCourte" rows={2} />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Création…" : "Créer la procédure"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
