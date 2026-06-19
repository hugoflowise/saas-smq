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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAuditAction } from "@/lib/actions/audits-revues";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AuditDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await createAuditAction({
      typeAudit: f.get("typeAudit"),
      organisme: f.get("organisme") || undefined,
      datePrevue: f.get("datePrevue") || undefined,
      dureePrevue: f.get("dureePrevue") || undefined,
      statut: f.get("statut"),
    });
    setPending(false);
    if (result.ok) {
      toast.success("Audit planifié. Ouvrez-le pour renseigner le périmètre et le rapport.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouvel audit</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Planifier un audit</DialogTitle>
          <DialogDescription>
            Le périmètre, le rapport et les écarts se renseignent ensuite sur la fiche de l'audit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="typeAudit">Type d'audit</Label>
            <select id="typeAudit" name="typeAudit" className={SELECT_CLASS} defaultValue="interne">
              <option value="interne">Interne</option>
              <option value="externe">Externe (certification / client)</option>
              <option value="fournisseur">Fournisseur</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organisme">Organisme</Label>
            <Input
              id="organisme"
              name="organisme"
              placeholder="Certificateur, client ou fournisseur (optionnel)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="datePrevue">Date prévue</Label>
            <Input id="datePrevue" name="datePrevue" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dureePrevue">Durée prévue (heures)</Label>
            <Input id="dureePrevue" name="dureePrevue" type="number" step="any" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="statut">Statut</Label>
            <select id="statut" name="statut" className={SELECT_CLASS} defaultValue="planifie">
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="realise">Réalisé</option>
              <option value="rapport_redige">Rapport rédigé</option>
              <option value="cloture">Clôturé</option>
            </select>
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Création…" : "Planifier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
