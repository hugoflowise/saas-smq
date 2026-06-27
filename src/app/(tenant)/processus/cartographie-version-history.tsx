"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { type CartographieSnapshot, CartographieSnapshotView } from "./cartographie-snapshot";

export type CartographieVersionItem = {
  id: string;
  version: string;
  publishedAt: string | null;
  publisher: string | null;
  snapshot: CartographieSnapshot | null;
};

/** Historique des versions figées de la cartographie (même logique que les autres documents). */
export function CartographieVersionHistory({ versions }: { versions: CartographieVersionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {versions.length === 0 ? (
        <li className="text-muted-foreground text-sm">
          Aucune version publiée pour l'instant. La première publication créera la version A.
        </li>
      ) : (
        versions.map((v) => (
          <li
            key={v.id}
            className="flex items-start justify-between gap-3 rounded-md border bg-surface px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="font-semibold">Version {v.version}</span>
                <span className="text-muted-foreground">
                  publiée le {formatDate(v.publishedAt)}
                </span>
              </span>
              {v.publisher ? (
                <span className="text-muted-foreground text-xs">par {v.publisher}</span>
              ) : null}
            </span>

            <Dialog open={openId === v.id} onOpenChange={(o) => setOpenId(o ? v.id : null)}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="sm">
                    Voir
                  </Button>
                }
              />
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                  <DialogTitle>
                    Cartographie · version {v.version} ({formatDate(v.publishedAt)})
                  </DialogTitle>
                </DialogHeader>
                {v.snapshot ? (
                  <CartographieSnapshotView snapshot={v.snapshot} />
                ) : (
                  <p className="text-muted-foreground text-sm">Instantané indisponible.</p>
                )}
              </DialogContent>
            </Dialog>
          </li>
        ))
      )}
    </ul>
  );
}
