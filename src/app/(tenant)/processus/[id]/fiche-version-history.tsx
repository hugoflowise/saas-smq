"use client";

import { useState } from "react";
import { FicheProcessus, type FicheProcessusData } from "@/components/fiche-processus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

export type FicheVersionItem = {
  id: string;
  version: string;
  approvedAt: string | null;
  redacteur: string | null;
  verificateur: string | null;
  approbateur: string | null;
  snapshot: FicheProcessusData | null;
};

const STATUT_EN_COURS_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée, en attente de publication",
};

/** Historique des versions figées de la fiche (même logique que les autres documents). */
export function FicheVersionHistory({
  versions,
  pending,
}: {
  versions: FicheVersionItem[];
  pending?: { version: string; statut: string } | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const pendingItem =
    pending && pending.statut !== "publiee" ? (
      <li className="flex flex-col gap-0.5 rounded-md border border-status-pa/40 border-dashed bg-status-pa/10 px-3 py-2 text-sm">
        <span className="flex flex-wrap items-center gap-x-2">
          <span className="font-semibold">Version en cours</span>
          <span className="inline-flex items-center rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-status-pa text-xs">
            Non publiée
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          {STATUT_EN_COURS_LABEL[pending.statut] ?? pending.statut}
        </span>
      </li>
    ) : null;

  return (
    <ul className="flex flex-col gap-2">
      {pendingItem}
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
                <span className="text-muted-foreground">publiée le {formatDate(v.approvedAt)}</span>
              </span>
              {v.redacteur || v.verificateur || v.approbateur ? (
                <span className="text-muted-foreground text-xs">
                  {[
                    v.redacteur ? `Réd. ${v.redacteur}` : null,
                    v.verificateur ? `Vérif. ${v.verificateur}` : null,
                    v.approbateur ? `Appr. ${v.approbateur}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
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
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    Fiche d'identité · version {v.version} ({formatDate(v.approvedAt)})
                  </DialogTitle>
                </DialogHeader>
                {v.snapshot ? (
                  <FicheProcessus {...v.snapshot} />
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
