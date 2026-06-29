"use client";

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
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import type { TenantMember } from "@/lib/tenant-users";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function AuditDialog({ auditeurs }: { auditeurs: TenantMember[] }) {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) =>
        createAuditAction({
          typeAudit: f.get("typeAudit"),
          organisme: f.get("organisme") || undefined,
          auditeurId: f.get("auditeurId") || undefined,
          datePrevue: f.get("datePrevue") || undefined,
          dureePrevue: f.get("dureePrevue") || undefined,
          statut: f.get("statut"),
        }),
      success: "Audit planifié. Ouvrez-le pour renseigner le périmètre et le rapport.",
    });
  }

  // Création uniquement : masquée pour l'auditeur (lecture seule).
  if (readOnly) return null;

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
            <Label htmlFor="auditeurId">Auditeur</Label>
            <select id="auditeurId" name="auditeurId" className={SELECT_CLASS} defaultValue="">
              <option value="">À désigner</option>
              {auditeurs.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              L'auditeur doit être impartial : il ne peut pas auditer un processus qu'il pilote
              (§9.2.2).
            </p>
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
