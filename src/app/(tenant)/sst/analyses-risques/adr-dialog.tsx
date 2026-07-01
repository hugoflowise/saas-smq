"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
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
import { createAdrAction, updateAdrAction } from "@/lib/actions/analyses-risques";
import { ADR_STATUT_LABELS, ADR_STATUTS } from "@/lib/adr";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type AdrRow = {
  id: string;
  intitule: string;
  mission: string | null;
  lieu: string | null;
  date_analyse: string | null;
  date_revision: string | null;
  statut: string;
  pdp_requis: boolean;
  pdp_reference: string | null;
  pdp_date_signature: string | null;
  notes: string | null;
};

/** Création / modification de l'en-tête d'une analyse de risques (une par mission). */
export function AdrDialog({ analyse }: { analyse?: AdrRow }) {
  const isEdit = Boolean(analyse);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();
  const [pdpRequis, setPdpRequis] = useState(analyse?.pdp_requis ?? false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) => {
        const data = {
          intitule: form.get("intitule"),
          mission: form.get("mission") || undefined,
          lieu: form.get("lieu") || undefined,
          dateAnalyse: form.get("dateAnalyse") || undefined,
          dateRevision: form.get("dateRevision") || undefined,
          statut: form.get("statut"),
          pdpRequis,
          pdpReference: form.get("pdpReference") || undefined,
          pdpDateSignature: form.get("pdpDateSignature") || undefined,
          notes: form.get("notes") || undefined,
        };
        return isEdit ? updateAdrAction({ id: analyse?.id, ...data }) : createAdrAction(data);
      },
      success: isEdit ? "Analyse mise à jour." : "Analyse créée.",
    });
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="size-4" />
              Modifier
            </Button>
          ) : (
            <Button>Nouvelle analyse</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'analyse" : "Nouvelle analyse de risques"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé</Label>
            <Input
              id="intitule"
              name="intitule"
              required
              defaultValue={analyse?.intitule}
              placeholder="Intervention soudure, chantier Awake"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mission">Mission / client</Label>
              <Input
                id="mission"
                name="mission"
                defaultValue={analyse?.mission ?? ""}
                placeholder="Client, référence mission…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lieu">Lieu / site</Label>
              <Input id="lieu" name="lieu" defaultValue={analyse?.lieu ?? ""} placeholder="Site" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateAnalyse">Date d'analyse</Label>
              <Input
                id="dateAnalyse"
                name="dateAnalyse"
                type="date"
                defaultValue={analyse?.date_analyse ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateRevision">Prochaine révision</Label>
              <Input
                id="dateRevision"
                name="dateRevision"
                type="date"
                defaultValue={analyse?.date_revision ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={analyse?.statut ?? "brouillon"}
              >
                {ADR_STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {ADR_STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={pdpRequis}
                onChange={(e) => setPdpRequis(e.target.checked)}
              />
              <span className="font-medium">Plan de prévention requis pour cette intervention</span>
            </label>
            {pdpRequis ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pdpReference">Référence du PDP</Label>
                  <Input
                    id="pdpReference"
                    name="pdpReference"
                    defaultValue={analyse?.pdp_reference ?? ""}
                    placeholder="N° / lien du plan co-signé"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pdpDateSignature">Date de signature</Label>
                  <Input
                    id="pdpDateSignature"
                    name="pdpDateSignature"
                    type="date"
                    defaultValue={analyse?.pdp_date_signature ?? ""}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes / méthode</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={analyse?.notes ?? ""}
              placeholder="Visite préalable, participants, méthode d'analyse…"
            />
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'analyse"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
