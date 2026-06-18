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
import { createAuditAction, updateAuditAction } from "@/lib/actions/audits-revues";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type AuditRow = {
  id: string;
  perimetre: string | null;
  date_prevue: string | null;
  date_realisee: string | null;
  duree_prevue: number | null;
  statut: string;
  rapport: string | null;
  ecarts_constates: string | null;
};

export function AuditDialog({ audit }: { audit?: AuditRow }) {
  const router = useRouter();
  const isEdit = Boolean(audit);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      perimetre: f.get("perimetre") || undefined,
      datePrevue: f.get("datePrevue") || undefined,
      dateRealisee: f.get("dateRealisee") || undefined,
      dureePrevue: f.get("dureePrevue") || undefined,
      statut: f.get("statut"),
      rapport: f.get("rapport") || undefined,
      ecartsConstates: f.get("ecartsConstates") || undefined,
    };
    const result = isEdit
      ? await updateAuditAction({ id: audit?.id, ...data })
      : await createAuditAction(data);
    setPending(false);
    if (result.ok) {
      toast.success(isEdit ? "Audit mis à jour." : "Audit planifié.");
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
            <Button>Nouvel audit</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'audit" : "Nouvel audit interne"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="perimetre">Périmètre (processus audités)</Label>
            <Input
              id="perimetre"
              name="perimetre"
              defaultValue={audit?.perimetre ?? ""}
              placeholder="Recrutement, Mise en mission…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={audit?.statut ?? "planifie"}
              >
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="realise">Réalisé</option>
                <option value="rapport_redige">Rapport rédigé</option>
                <option value="cloture">Clôturé</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dureePrevue">Durée prévue (h)</Label>
              <Input
                id="dureePrevue"
                name="dureePrevue"
                type="number"
                step="any"
                defaultValue={audit?.duree_prevue ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="datePrevue">Date prévue</Label>
              <Input
                id="datePrevue"
                name="datePrevue"
                type="date"
                defaultValue={audit?.date_prevue ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateRealisee">Date réalisée</Label>
              <Input
                id="dateRealisee"
                name="dateRealisee"
                type="date"
                defaultValue={audit?.date_realisee ?? ""}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rapport">Rapport d'audit</Label>
            <Textarea id="rapport" name="rapport" rows={4} defaultValue={audit?.rapport ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ecartsConstates">Écarts constatés</Label>
            <Textarea
              id="ecartsConstates"
              name="ecartsConstates"
              rows={3}
              defaultValue={audit?.ecarts_constates ?? ""}
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Planifier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
