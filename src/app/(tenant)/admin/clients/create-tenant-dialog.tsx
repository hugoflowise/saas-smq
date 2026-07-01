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
import { createTenantAction } from "@/lib/actions/tenants";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SECTEUR_LABELS, SECTEUR_OPTIONS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function CreateTenantDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) =>
        createTenantAction({
          nomSociete: form.get("nomSociete"),
          dirigeantEmail: form.get("dirigeantEmail"),
          dirigeantNom: form.get("dirigeantNom") || undefined,
          formule: form.get("formule"),
          effectif: form.get("effectif") || undefined,
          secteur: form.get("secteur") || undefined,
          bureauEtudes: form.get("bureauEtudes") === "on",
        }),
      success: "Client créé. Le dirigeant peut se connecter via son e-mail.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Nouveau client</Button>} />
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>Crée la société et le compte de son dirigeant.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nomSociete">Nom de la société</Label>
            <Input id="nomSociete" name="nomSociete" required placeholder="Acme Ingénierie" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dirigeantEmail">E-mail du dirigeant</Label>
            <Input
              id="dirigeantEmail"
              name="dirigeantEmail"
              type="email"
              required
              placeholder="dg@acme.fr"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dirigeantNom">Nom du dirigeant (optionnel)</Label>
            <Input id="dirigeantNom" name="dirigeantNom" placeholder="Jean Dupont" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="formule">Formule</Label>
              <select id="formule" name="formule" className={SELECT_CLASS} defaultValue="Essentiel">
                <option value="Essentiel">Essentiel - licence seule</option>
                <option value="Tandem">Tandem - accompagnement</option>
                <option value="Premium">Premium - externalisé</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="effectif">Effectif</Label>
              <select id="effectif" name="effectif" className={SELECT_CLASS} defaultValue="10-49">
                <option value="1-9">1-9</option>
                <option value="10-49">10-49</option>
                <option value="50-99">50-99</option>
                <option value="100-299">100-299</option>
                <option value="300+">300+</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="secteur">Secteur</Label>
              <select id="secteur" name="secteur" className={SELECT_CLASS} defaultValue="SI">
                {SECTEUR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {SECTEUR_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="bureauEtudes" className="size-4" />
            Activité bureau d'études / conception (§8.3)
          </label>

          <p className="rounded-lg border bg-surface p-3 text-muted-foreground text-xs">
            Le préremplissage dépend de la formule : <strong>Essentiel</strong> = app vide (le
            client construit son SMQ) ; <strong>Tandem</strong> et <strong>Premium</strong> = app
            pré-remplie (processus, actions ISO et parties prenantes types). La procédure de
            maîtrise documentaire est toujours créée.
          </p>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Création…" : "Créer le client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
