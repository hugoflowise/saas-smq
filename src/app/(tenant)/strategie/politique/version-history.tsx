"use client";

import type { JSONContent } from "@tiptap/react";
import { useState } from "react";
import { DocumentPaper, type Societe } from "@/components/document-paper";
import { Signataire } from "@/components/maitrise-document";
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
  approverSignature?: string | null;
  snapshot: JSONContent | null;
  /** Circuit de révision · optionnel. */
  redacteur?: string | null;
  redacteurSignature?: string | null;
  redacteurSignedAt?: string | null;
  verificateur?: string | null;
  verificateurSignature?: string | null;
  verificateurSignedAt?: string | null;
  noteRevision?: string | null;
};

/** Gabarit officiel pour afficher un instantané dans son document mis en forme. */
export type VersionDocumentChrome = {
  surtitre: string;
  titre: string;
  societe: Societe;
  reference?: string | null;
  /** Affiche la cellule « Vérifié par » (circuit à 3 rôles). */
  withVerification?: boolean;
};

const STATUT_EN_COURS_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En vérification",
  en_approbation: "En approbation",
  approuvee: "Approuvée, en attente de publication",
};

export function VersionHistory({
  versions,
  pending,
  document,
}: {
  versions: VersionItem[];
  /** Version de travail non encore publiée (brouillon / en revue / approuvée). */
  pending?: { version: string; statut: string } | null;
  /**
   * Si fourni, l'aperçu « Voir » rend l'instantané dans le gabarit officiel
   * (en-tête charté, tableau d'identité, signature) plutôt que le contenu brut.
   */
  document?: VersionDocumentChrome;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const pendingItem = pending ? (
    <li className="flex flex-col gap-0.5 rounded-md border border-status-pa/40 border-dashed bg-status-pa/10 px-3 py-2 text-sm">
      <span className="flex flex-wrap items-center gap-x-2">
        <span className="font-semibold">{pending.version}</span>
        <span className="inline-flex items-center rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-status-pa text-xs">
          Non publiée
        </span>
      </span>
      <span className="text-muted-foreground text-xs">
        {STATUT_EN_COURS_LABEL[pending.statut] ?? pending.statut}
      </span>
    </li>
  ) : null;

  if (versions.length === 0) {
    return (
      <ul className="flex flex-col gap-2">
        {pendingItem}
        <li className="text-muted-foreground text-sm">
          Aucune version publiée pour l'instant. La première publication créera la version A.
        </li>
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {pendingItem}
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
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  Politique qualité · {v.version} ({formatDate(v.approvedAt)})
                </DialogTitle>
              </DialogHeader>
              {document ? (
                <DocumentPaper
                  surtitre={document.surtitre}
                  titre={document.titre}
                  societe={document.societe}
                  meta={[
                    ...(document.reference !== undefined
                      ? [{ label: "Référence", value: document.reference?.trim() || "-" }]
                      : []),
                    { label: "Version", value: v.version },
                    { label: "Approuvée le", value: formatDate(v.approvedAt) },
                    ...(v.approverName ? [{ label: "Signataire", value: v.approverName }] : []),
                  ]}
                  className="border"
                >
                  <TiptapEditor content={v.snapshot} editable={false} bare />
                  {v.redacteur || v.verificateur || v.approverName ? (
                    <div
                      className={`mt-8 grid overflow-hidden rounded-md border text-sm ${
                        document.withVerification ? "grid-cols-3" : "grid-cols-2"
                      }`}
                    >
                      <Signataire
                        label="Rédigé par"
                        nom={v.redacteur ?? null}
                        image={v.redacteurSignature ?? null}
                        date={v.redacteurSignedAt ?? null}
                        signe={Boolean(v.redacteur)}
                      />
                      {document.withVerification ? (
                        <Signataire
                          label="Vérifié par"
                          nom={v.verificateur ?? null}
                          image={v.verificateurSignature ?? null}
                          date={v.verificateurSignedAt ?? null}
                          signe={Boolean(v.verificateur)}
                          border
                        />
                      ) : null}
                      <Signataire
                        label="Approuvé par"
                        nom={v.approverName}
                        image={v.approverSignature ?? null}
                        date={v.approvedAt}
                        signe={Boolean(v.approverName)}
                        border
                      />
                    </div>
                  ) : null}
                </DocumentPaper>
              ) : (
                <TiptapEditor content={v.snapshot} editable={false} />
              )}
            </DialogContent>
          </Dialog>
        </li>
      ))}
    </ul>
  );
}
