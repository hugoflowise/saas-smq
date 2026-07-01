"use client";

import { Pencil } from "lucide-react";
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
import { createControleAction, updateControleAction } from "@/lib/actions/controles";
import { CONTROLE_STATUT_LABELS, CONTROLE_STATUTS } from "@/lib/controles";
import { DOMAINE_SSE_LABELS, DOMAINES_SSE } from "@/lib/domaines-sse";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type ControleRow = {
  id: string;
  intitule: string;
  equipement: string | null;
  organisme: string | null;
  domaine: string | null;
  periodicite_mois: number | null;
  date_dernier: string | null;
  date_prochain: string | null;
  statut: string;
  reference: string | null;
  observations: string | null;
};

/** Création / modification d'un contrôle réglementaire obligatoire. */
export function ControleDialog({ controle }: { controle?: ControleRow }) {
  const isEdit = Boolean(controle);
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const data = {
          intitule: f.get("intitule"),
          equipement: f.get("equipement") || undefined,
          organisme: f.get("organisme") || undefined,
          domaine: f.get("domaine") || undefined,
          periodiciteMois: f.get("periodiciteMois") || undefined,
          dateDernier: f.get("dateDernier") || undefined,
          dateProchain: f.get("dateProchain") || undefined,
          statut: f.get("statut"),
          reference: f.get("reference") || undefined,
          observations: f.get("observations") || undefined,
        };
        return isEdit
          ? updateControleAction({ id: controle?.id, ...data })
          : createControleAction(data);
      },
      success: isEdit ? "Contrôle mis à jour." : "Contrôle créé.",
    });
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" className="size-8" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>Nouveau contrôle</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le contrôle" : "Nouveau contrôle obligatoire"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="intitule">Intitulé du contrôle</Label>
            <Input
              id="intitule"
              name="intitule"
              required
              defaultValue={controle?.intitule}
              placeholder="Vérification générale périodique des appareils de levage"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipement">Équipement / installation</Label>
              <Input
                id="equipement"
                name="equipement"
                defaultValue={controle?.equipement ?? ""}
                placeholder="Pont roulant, extincteurs…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="organisme">Organisme de contrôle</Label>
              <Input
                id="organisme"
                name="organisme"
                defaultValue={controle?.organisme ?? ""}
                placeholder="APAVE, Bureau Veritas…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="domaine">Domaine SSE</Label>
              <select
                id="domaine"
                name="domaine"
                className={SELECT_CLASS}
                defaultValue={controle?.domaine ?? ""}
              >
                <option value="">-</option>
                {DOMAINES_SSE.map((d) => (
                  <option key={d} value={d}>
                    {DOMAINE_SSE_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="periodiciteMois">Périodicité (mois)</Label>
              <Input
                id="periodiciteMois"
                name="periodiciteMois"
                type="number"
                min={1}
                defaultValue={controle?.periodicite_mois ?? ""}
                placeholder="12"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateDernier">Dernier contrôle</Label>
              <Input
                id="dateDernier"
                name="dateDernier"
                type="date"
                defaultValue={controle?.date_dernier ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateProchain">Prochaine échéance</Label>
              <Input
                id="dateProchain"
                name="dateProchain"
                type="date"
                defaultValue={controle?.date_prochain ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={controle?.statut ?? "a_planifier"}
              >
                {CONTROLE_STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {CONTROLE_STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Référence du rapport</Label>
              <Input id="reference" name="reference" defaultValue={controle?.reference ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              name="observations"
              rows={2}
              defaultValue={controle?.observations ?? ""}
              placeholder="Réserves, points à lever…"
            />
          </div>

          <p className="text-muted-foreground text-xs">
            Si l'échéance n'est pas saisie, elle est calculée à partir du dernier contrôle et de la
            périodicité.
          </p>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le contrôle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
