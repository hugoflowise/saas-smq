"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  refuserElementAction,
  refuserToutAction,
  validerElementAction,
  validerToutAction,
} from "@/lib/actions/validation";
import { useReadOnly } from "@/lib/hooks/read-only-context";

type TableProposee = "processus" | "actions" | "parties_interessees";

/** Bouton « Valider » pour un élément prérempli (le rend pris en compte). */
export function ValiderButton({ table, id }: { table: TableProposee; id: string }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);

  async function valider(e: React.MouseEvent) {
    // Utile si le bouton est posé à l'intérieur d'un lien (cartes processus).
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const r = await validerElementAction({ table, id });
    setPending(false);
    if (r.ok) {
      toast.success("Élément validé.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  if (readOnly) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
      disabled={pending}
      onClick={valider}
    >
      <Check className="size-3.5" />
      Valider
    </Button>
  );
}

/**
 * Bouton « Refuser » pour un élément prérempli. Ouvre une confirmation intégrée à
 * l'app (modale React, pas la boîte `confirm()` native que le navigateur peut
 * bloquer après plusieurs usages), puis supprime l'élément proposé.
 */
export function RefuserButton({ table, id }: { table: TableProposee; id: string }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onConfirm() {
    setPending(true);
    const r = await refuserElementAction({ table, id });
    setPending(false);
    if (r.ok) {
      setOpen(false);
      toast.success("Élément supprimé.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 gap-1.5 px-2.5 text-muted-foreground text-xs hover:text-destructive"
            // La carte est un lien : on empêche la navigation au clic sur « Refuser ».
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <X className="size-3.5" />
            Refuser
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refuser cet élément proposé</DialogTitle>
          <DialogDescription>
            Il sera supprimé définitivement. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Suppression…" : "Refuser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Bannière d'en-tête de module : explique que des éléments sont préremplis et
 * propose « Tout valider » / « Tout refuser ». Ne s'affiche pas s'il n'y a rien à
 * valider. Les deux actions passent par une confirmation intégrée (modale React).
 */
export function ProposeBanner({
  table,
  count,
  libelle,
}: {
  table: TableProposee;
  /** Nombre d'éléments proposés non encore validés. */
  count: number;
  /** Nom de la collection au pluriel (ex. « parties prenantes », « processus »). */
  libelle: string;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);
  const [confirmRefus, setConfirmRefus] = useState(false);
  if (count <= 0) return null;

  async function validerTout() {
    setPending(true);
    const r = await validerToutAction({ table });
    setPending(false);
    if (r.ok) {
      toast.success("Tous les éléments proposés ont été validés.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  async function refuserTout() {
    setPending(true);
    const r = await refuserToutAction({ table });
    setPending(false);
    if (r.ok) {
      setConfirmRefus(false);
      toast.success("Tous les éléments proposés ont été supprimés.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-status-pa/40 bg-status-pa/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-status-pa">
        Flowise a prérempli <strong>{count}</strong> {libelle} pour vous faire gagner du temps.
        Passez chaque élément en revue, puis validez-le, modifiez-le ou supprimez-le. Tant qu'un
        élément n'est pas validé, il n'est pas comptabilisé.
      </p>
      {readOnly ? null : (
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={pending}
            onClick={validerTout}
          >
            <Check className="size-3.5" />
            Tout valider
          </Button>
          <Dialog open={confirmRefus} onOpenChange={setConfirmRefus}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                  disabled={pending}
                >
                  <X className="size-3.5" />
                  Tout refuser
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tout refuser</DialogTitle>
                <DialogDescription>
                  Les <strong>{count}</strong> {libelle} proposés non validés seront supprimés
                  définitivement. Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Annuler</Button>} />
                <Button variant="destructive" disabled={pending} onClick={refuserTout}>
                  {pending ? "Suppression…" : "Tout refuser"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
