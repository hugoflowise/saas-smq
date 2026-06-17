"use client";

import { Pencil } from "lucide-react";
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
import { updateTenantAction } from "@/lib/actions/tenants";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Tenant = {
  id: string;
  nom_societe: string;
  effectif_tranche: string | null;
  secteur: string | null;
};

type Dirigeant = { id: string; full_name: string | null; email: string } | null;

export function EditTenantDialog({ tenant, dirigeant }: { tenant: Tenant; dirigeant: Dirigeant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const result = await updateTenantAction({
      tenantId: tenant.id,
      nomSociete: form.get("nomSociete"),
      effectif: form.get("effectif") || undefined,
      secteur: form.get("secteur") || undefined,
      dirigeantId: dirigeant?.id,
      dirigeantNom: form.get("dirigeantNom") || undefined,
    });

    setPending(false);

    if (result.ok) {
      toast.success("Client mis à jour.");
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
          <Button variant="ghost" size="icon" aria-label="Modifier">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>{tenant.nom_societe}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nomSociete">Nom de la société</Label>
            <Input id="nomSociete" name="nomSociete" required defaultValue={tenant.nom_societe} />
          </div>

          {dirigeant ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="dirigeantNom">Nom du dirigeant</Label>
              <Input
                id="dirigeantNom"
                name="dirigeantNom"
                defaultValue={dirigeant.full_name ?? ""}
                placeholder="Jean Dupont"
              />
              <p className="text-muted-foreground text-xs">{dirigeant.email}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="effectif">Effectif</Label>
              <select
                id="effectif"
                name="effectif"
                className={SELECT_CLASS}
                defaultValue={tenant.effectif_tranche ?? "10-49"}
              >
                <option value="1-9">1-9</option>
                <option value="10-49">10-49</option>
                <option value="50-99">50-99</option>
                <option value="100-299">100-299</option>
                <option value="300+">300+</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="secteur">Secteur</Label>
              <select
                id="secteur"
                name="secteur"
                className={SELECT_CLASS}
                defaultValue={tenant.secteur ?? "ESN"}
              >
                <option value="SI">SI</option>
                <option value="ESN">ESN</option>
                <option value="AT">AT</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
