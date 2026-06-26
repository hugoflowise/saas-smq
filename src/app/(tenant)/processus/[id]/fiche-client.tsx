"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { IndicateurRow } from "@/app/(tenant)/indicateurs/create-indicateur-dialog";
import type { RoRow } from "@/app/(tenant)/risques/ro-dialog";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { FicheProcessus, type FicheProcessusData } from "@/components/fiche-processus";
import { SignatureCapture } from "@/components/signature-capture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publishFicheAction, transitionFicheAction } from "@/lib/actions/processus-fiche";
import type { FicheUser } from "@/lib/fiche-processus-data";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { FicheEditor, type FicheEditorInitial } from "./fiche-editor";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
};

export function FicheClient({
  data,
  initial,
  users,
  statut,
  canWrite,
  canApprove,
  printHref,
  indicateurs,
  risques,
  processusOptions,
}: {
  data: FicheProcessusData;
  initial: FicheEditorInitial;
  users: FicheUser[];
  statut: string;
  canWrite: boolean;
  canApprove: boolean;
  printHref: string;
  indicateurs: IndicateurRow[];
  risques: RoRow[];
  processusOptions: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  const editable = statut === "brouillon" && canWrite && !readOnly;

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    setPending(true);
    const r = await fn();
    setPending(false);
    if (r.ok) {
      toast.success(message);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  if (editing && editable) {
    return (
      <FicheEditor
        initial={initial}
        users={users}
        indicateurs={indicateurs}
        risques={risques}
        processusOptions={processusOptions}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Statut</span>
          <Badge variant="secondary">{STATUT_LABELS[statut] ?? statut}</Badge>
          {data.version ? (
            <span className="text-muted-foreground">
              · version {data.version}
              {data.versionDate
                ? ` du ${new Date(data.versionDate).toLocaleDateString("fr-FR")}`
                : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">· version non encore publiée</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <DownloadPdfButton printHref={printHref} />
          {editable ? <Button onClick={() => setEditing(true)}>Modifier la fiche</Button> : null}

          {statut === "brouillon" && canWrite && !readOnly ? (
            <SignatureCapture
              triggerLabel="Soumettre à approbation"
              title="Soumettre la fiche à approbation"
              description="Signez avec votre mot de passe pour soumettre cette fiche à approbation."
              onSigned={() =>
                run(
                  () => transitionFicheAction(initial.id, "en_revue"),
                  "Fiche soumise à approbation.",
                )
              }
            />
          ) : null}

          {statut === "en_revue" && canApprove && !readOnly ? (
            <>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(
                    () => transitionFicheAction(initial.id, "brouillon"),
                    "Fiche renvoyée en brouillon.",
                  )
                }
              >
                Demander des modifications
              </Button>
              <SignatureCapture
                triggerLabel="Approuver et signer"
                title="Approuver la fiche d'identité"
                description="Signez avec votre mot de passe pour approuver ce document."
                onSigned={() =>
                  run(
                    () => transitionFicheAction(initial.id, "approuvee"),
                    "Fiche approuvée et signée.",
                  )
                }
              />
            </>
          ) : null}

          {statut === "approuvee" && canApprove && !readOnly ? (
            <Button
              disabled={pending}
              onClick={() => run(() => publishFicheAction(initial.id), "Fiche publiée.")}
            >
              Publier
            </Button>
          ) : null}

          {statut === "publiee" && canWrite && !readOnly ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () => transitionFicheAction(initial.id, "brouillon"),
                  "Nouvelle version en brouillon.",
                )
              }
            >
              Créer une nouvelle version
            </Button>
          ) : null}
        </div>
      </div>

      {statut === "brouillon" ? (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
          Étape : <span className="font-medium text-foreground">rédaction</span>. Complétez la
          fiche, puis « Soumettre à approbation » (rédacteur : manager ou dirigeant).
        </div>
      ) : null}
      {statut === "en_revue" ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">
            En attente d'approbation par le dirigeant.
          </span>{" "}
          <span className="text-muted-foreground">
            {canApprove
              ? "Vérifiez la fiche puis « Approuver et signer »."
              : "Seul le dirigeant peut approuver et signer."}
          </span>
        </div>
      ) : null}
      {statut === "approuvee" ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">Approuvée, non encore publiée.</span>{" "}
          <span className="text-muted-foreground">
            Cliquez « Publier » pour figer la version diffusée à l'entreprise.
          </span>
        </div>
      ) : null}

      <FicheProcessus {...data} />
    </div>
  );
}
