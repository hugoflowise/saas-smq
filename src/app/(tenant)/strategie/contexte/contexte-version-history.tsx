"use client";

import { Trash2 } from "lucide-react";
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
import { deleteContexteVersionAction } from "@/lib/actions/contexte";
import { formatDate } from "@/lib/format";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { type ContexteSnapshot, ContexteSnapshotView } from "./contexte-snapshot";

export type ContexteVersionItem = {
  id: string;
  version: string;
  publishedAt: string | null;
  publisher: string | null;
  snapshot: ContexteSnapshot | null;
};

/** Historique des versions figées de l'analyse de contexte. */
export function ContexteVersionHistory({ versions }: { versions: ContexteVersionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const readOnly = useReadOnly();

  if (versions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune version publiée pour l'instant. La première publication créera la version A.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex items-start justify-between gap-3 rounded-md border bg-surface px-3 py-2 text-sm"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="font-semibold">Version {v.version}</span>
              <span className="text-muted-foreground">publiée le {formatDate(v.publishedAt)}</span>
            </span>
            {v.publisher ? (
              <span className="text-muted-foreground text-xs">par {v.publisher}</span>
            ) : null}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            <Dialog open={openId === v.id} onOpenChange={(o) => setOpenId(o ? v.id : null)}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="sm">
                    Voir
                  </Button>
                }
              />
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    Analyse de contexte · version {v.version} ({formatDate(v.publishedAt)})
                  </DialogTitle>
                </DialogHeader>
                {v.snapshot ? (
                  <ContexteSnapshotView snapshot={v.snapshot} />
                ) : (
                  <p className="text-muted-foreground text-sm">Instantané indisponible.</p>
                )}
              </DialogContent>
            </Dialog>

            {readOnly ? null : <SupprimerVersionButton version={v} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Suppression définitive d'une version figée par erreur (confirmation explicite). */
function SupprimerVersionButton({ version }: { version: ContexteVersionItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function supprimer() {
    setPending(true);
    const r = await deleteContexteVersionAction(version.id);
    setPending(false);
    if (r.ok) {
      toast.success(`Version ${version.version} supprimée.`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Supprimer la version ${version.version}`}
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la version {version.version} ?</DialogTitle>
          <DialogDescription>
            Cette version figée sera définitivement supprimée de l'historique. À n'utiliser que pour
            une version créée par erreur. Les autres versions ne sont pas modifiées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button variant="destructive" onClick={supprimer} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
