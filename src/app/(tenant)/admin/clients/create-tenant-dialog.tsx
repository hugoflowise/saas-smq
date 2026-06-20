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
import { createTenantAction } from "@/lib/actions/tenants";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function CreateTenantDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const result = await createTenantAction({
      nomSociete: form.get("nomSociete"),
      dirigeantEmail: form.get("dirigeantEmail"),
      dirigeantNom: form.get("dirigeantNom") || undefined,
      formule: form.get("formule"),
      effectif: form.get("effectif") || undefined,
      secteur: form.get("secteur") || undefined,
    });

    setPending(false);

    if (result.ok) {
      toast.success("Client créé. Le dirigeant peut se connecter via son e-mail.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
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
                <option value="Essentiel">Essentiel</option>
                <option value="Tandem">Tandem</option>
                <option value="Premium">Premium</option>
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
              <select id="secteur" name="secteur" className={SELECT_CLASS} defaultValue="ESN">
                <option value="SI">SI</option>
                <option value="ESN">ESN</option>
                <option value="AT">AT</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Création…" : "Créer le client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
