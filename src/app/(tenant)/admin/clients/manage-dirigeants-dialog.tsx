"use client";

import { Trash2, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import {
  addDirigeantAction,
  removeDirigeantAction,
  updateDirigeantAction,
} from "@/lib/actions/tenants";

export type Dirigeant = { id: string; full_name: string | null; email: string };

function DirigeantRow({
  tenantId,
  dirigeant,
  canRemove,
}: {
  tenantId: string;
  dirigeant: Dirigeant;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nom, setNom] = useState(dirigeant.full_name ?? "");
  const [email, setEmail] = useState(dirigeant.email);

  const dirty = nom !== (dirigeant.full_name ?? "") || email !== dirigeant.email;

  function save() {
    startTransition(async () => {
      const r = await updateDirigeantAction({
        tenantId,
        dirigeantId: dirigeant.id,
        nom: nom || undefined,
        email,
      });
      if (r.ok) {
        toast.success("Dirigeant mis à jour.");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await removeDirigeantAction({ tenantId, dirigeantId: dirigeant.id });
      if (r.ok) {
        toast.success("Dirigeant retiré.");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border bg-card p-3">
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`nom-${dirigeant.id}`}>
            Nom
          </Label>
          <Input
            id={`nom-${dirigeant.id}`}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`email-${dirigeant.id}`}>
            E-mail
          </Label>
          <Input
            id={`email-${dirigeant.id}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <Button type="button" size="sm" onClick={save} disabled={pending || !dirty}>
        Enregistrer
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={remove}
        disabled={pending || !canRemove}
        aria-label="Retirer ce dirigeant"
        title={canRemove ? "Retirer ce dirigeant" : "Le client doit garder au moins un dirigeant"}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function ManageDirigeantsDialog({
  tenantId,
  nomSociete,
  dirigeants,
}: {
  tenantId: string;
  nomSociete: string;
  dirigeants: Dirigeant[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newNom, setNewNom] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function add() {
    startTransition(async () => {
      const r = await addDirigeantAction({
        tenantId,
        email: newEmail,
        nom: newNom || undefined,
      });
      if (r.ok) {
        toast.success("Dirigeant ajouté · e-mail de bienvenue envoyé.");
        setNewNom("");
        setNewEmail("");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Gérer les dirigeants">
            <Users className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dirigeants</DialogTitle>
          <DialogDescription>{nomSociete}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {dirigeants.length > 0 ? (
            dirigeants.map((d) => (
              <DirigeantRow
                key={d.id}
                tenantId={tenantId}
                dirigeant={d}
                canRemove={dirigeants.length > 1}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">Aucun dirigeant rattaché à ce client.</p>
          )}

          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-dashed p-3">
            <p className="flex items-center gap-2 font-medium text-sm">
              <UserPlus className="size-4" /> Ajouter un dirigeant
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs" htmlFor="new-nom">
                  Nom
                </Label>
                <Input
                  id="new-nom"
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs" htmlFor="new-email">
                  E-mail
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="dirigeant@societe.fr"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={add}
              disabled={pending || !newEmail}
              className="self-start"
            >
              {pending ? "Ajout…" : "Ajouter et inviter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
