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
import { updateTenantAction, uploadTenantLogoAction } from "@/lib/actions/tenants";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SECTEUR_LABELS, SECTEUR_OPTIONS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

type Tenant = {
  id: string;
  nom_societe: string;
  effectif_tranche: string | null;
  secteur: string | null;
  bureau_etudes: boolean;
  logo_url: string | null;
  responsable_flowise_id: string | null;
};

type Dirigeant = { id: string; full_name: string | null; email: string } | null;

export function EditTenantDialog({
  tenant,
  dirigeant,
  flowiseTeam,
}: {
  tenant: Tenant;
  dirigeant: Dirigeant;
  flowiseTeam: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const { open, setOpen, pending, submit } = useDialogForm();
  const [uploading, setUploading] = useState(false);

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("tenantId", tenant.id);
    fd.set("file", file);
    const result = await uploadTenantLogoAction(fd);
    setUploading(false);
    if (result.ok) {
      toast.success("Logo mis à jour.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (form) =>
        updateTenantAction({
          tenantId: tenant.id,
          nomSociete: form.get("nomSociete"),
          effectif: form.get("effectif") || undefined,
          secteur: form.get("secteur") || undefined,
          bureauEtudes: form.get("bureauEtudes") === "on",
          dirigeantId: dirigeant?.id,
          dirigeantNom: form.get("dirigeantNom") || undefined,
          responsableFlowiseId: form.get("responsableFlowiseId") || "",
        }),
      success: "Client mis à jour.",
    });
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>{tenant.nom_societe}</DialogDescription>
        </DialogHeader>

        {/* Logo (upload séparé, immédiat) */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface">
            {tenant.logo_url ? (
              // biome-ignore lint/performance/noImgElement: logo externe (Supabase Storage), taille fixe
              <img src={tenant.logo_url} alt="Logo" className="size-full object-contain" />
            ) : (
              <span className="text-muted-foreground text-xs">Aucun</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="logo">Logo de la société</Label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleLogoChange}
              className="text-sm file:mr-3 file:rounded-md file:border file:bg-card file:px-3 file:py-1 file:text-sm"
            />
            <span className="text-muted-foreground text-xs">PNG, JPG ou SVG · max 2 Mo</span>
          </div>
        </div>

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

          <div className="flex flex-col gap-2">
            <Label htmlFor="responsableFlowiseId">Responsable Qualité Flowise</Label>
            <select
              id="responsableFlowiseId"
              name="responsableFlowiseId"
              className={SELECT_CLASS}
              defaultValue={tenant.responsable_flowise_id ?? ""}
            >
              <option value="">Aucun</option>
              {flowiseTeam.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">
              Sélectionnable comme pilote de processus chez ce client (offre premium).
            </p>
          </div>

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
                defaultValue={tenant.secteur ?? "SI"}
              >
                {SECTEUR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {SECTEUR_LABELS[s]}
                  </option>
                ))}
                {/* Valeur héritée (ex. AT) conservée tant qu'elle n'est pas modifiée. */}
                {tenant.secteur && !SECTEUR_OPTIONS.includes(tenant.secteur as never) ? (
                  <option value={tenant.secteur}>
                    {SECTEUR_LABELS[tenant.secteur as keyof typeof SECTEUR_LABELS] ??
                      tenant.secteur}
                  </option>
                ) : null}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="bureauEtudes"
              className="size-4"
              defaultChecked={tenant.bureau_etudes}
            />
            Activité bureau d'études / conception (§8.3)
          </label>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
