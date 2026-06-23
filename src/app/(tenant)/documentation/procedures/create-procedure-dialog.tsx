"use client";

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
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function CreateProcedureDialog({
  processusOptions,
  presetProcessusId,
}: {
  processusOptions: { id: string; nom: string }[];
  presetProcessusId?: string;
}) {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) =>
        createProcedureAction({
          titre: form.get("titre"),
          processusId: form.get("processusId") || undefined,
          descriptionCourte: form.get("descriptionCourte") || undefined,
          referenceIso: form.get("referenceIso") || undefined,
        }),
      success: "Procédure créée.",
    });
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouvelle procédure</Button>} />
      <DialogContent className="sm:max-w-3xl">
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
              <option value="">-</option>
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
