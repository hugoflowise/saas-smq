"use client";

import type { JSONContent } from "@tiptap/react";
import { useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

export type VersionItem = {
  id: string;
  version: string;
  approvedAt: string | null;
  approverName: string | null;
  snapshot: JSONContent | null;
  /** Circuit de révision (procédures) — optionnel. */
  redacteur?: string | null;
  verificateur?: string | null;
  noteRevision?: string | null;
};

export function VersionHistory({ versions }: { versions: VersionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune version publiée pour l'instant. La première publication créera la version v1.
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
              <span className="font-semibold">{v.version}</span>
              <span className="text-muted-foreground">publiée le {formatDate(v.approvedAt)}</span>
            </span>
            {v.redacteur || v.verificateur || v.approverName ? (
              <span className="text-muted-foreground text-xs">
                {[
                  v.redacteur ? `Réd. ${v.redacteur}` : null,
                  v.verificateur ? `Vérif. ${v.verificateur}` : null,
                  v.approverName ? `Appr. ${v.approverName}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : v.approverName ? (
              <span className="text-muted-foreground text-xs">approuvée par {v.approverName}</span>
            ) : null}
            {v.noteRevision ? (
              <span className="text-muted-foreground text-xs italic">« {v.noteRevision} »</span>
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
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Politique qualité — {v.version} ({formatDate(v.approvedAt)})
                </DialogTitle>
              </DialogHeader>
              <TiptapEditor content={v.snapshot} editable={false} />
            </DialogContent>
          </Dialog>
        </li>
      ))}
    </ul>
  );
}
