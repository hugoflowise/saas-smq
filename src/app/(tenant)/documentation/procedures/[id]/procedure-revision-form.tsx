"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProcedureRevisionAction } from "@/lib/actions/procedures";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function ProcedureRevisionForm({
  id,
  redacteur,
  verificateur,
  noteRevision,
  approverName,
  canWrite,
  editable,
}: {
  id: string;
  redacteur: string | null;
  verificateur: string | null;
  noteRevision: string | null;
  approverName: string | null;
  canWrite: boolean;
  /** Modifiable uniquement en brouillon. */
  editable: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await updateProcedureRevisionAction(id, {
      redacteur: f.get("redacteur") || undefined,
      verificateur: f.get("verificateur") || undefined,
      noteRevision: f.get("noteRevision") || undefined,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Responsabilités enregistrées.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const disabled = readOnly || !canWrite || !editable;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="redacteur">Rédacteur</Label>
        <Input id="redacteur" name="redacteur" defaultValue={redacteur ?? ""} disabled={disabled} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="verificateur">Vérificateur</Label>
        <Input
          id="verificateur"
          name="verificateur"
          defaultValue={verificateur ?? ""}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Approbateur</Label>
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground">
          {approverName ?? "Défini à l'approbation (signature électronique)"}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="noteRevision">Note de révision (modifications)</Label>
        <Textarea
          id="noteRevision"
          name="noteRevision"
          rows={3}
          defaultValue={noteRevision ?? ""}
          disabled={disabled}
          placeholder="Ce qui a changé dans cette version…"
        />
      </div>
      {readOnly ? null : disabled ? (
        <p className="text-muted-foreground text-xs">
          {canWrite
            ? "Modifiable uniquement lorsque la procédure est en brouillon."
            : "Vous n'avez pas les droits de modification."}
        </p>
      ) : (
        <Button type="submit" size="sm" disabled={pending} className="w-fit">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      )}
    </form>
  );
}
