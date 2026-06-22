"use client";

import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DocumentPaper, type Societe } from "@/components/document-paper";
import { SignatureCapture } from "@/components/signature-capture";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  publishPolitiqueAction,
  savePolitiqueContenuAction,
  transitionPolitiqueStatutAction,
} from "@/lib/actions/politique";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
};

type Props = {
  initialContenu: JSONContent | null;
  statut: string;
  currentVersion: string | null;
  currentVersionDate: string | null;
  publishedCount: number;
  canWrite: boolean;
  canApprove: boolean;
  drafterName: string | null;
  approverName: string | null;
  approvedAt: string | null;
  societe: Societe;
};

export function PolitiqueClient({
  initialContenu,
  statut,
  currentVersion,
  currentVersionDate,
  publishedCount,
  canWrite,
  canApprove,
  drafterName,
  approverName,
  approvedAt,
  societe,
}: Props) {
  const router = useRouter();
  const contenuRef = useRef<JSONContent | null>(initialContenu);
  const dirtyRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const editable = statut === "brouillon" && canWrite;
  const isPublished = statut === "publiee";
  // Numéro que prendra la version en cours une fois publiée.
  const nextVersion = `v${publishedCount + 1}`;

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
  const documentMeta = [
    { label: "Statut", value: STATUT_LABELS[statut] ?? statut },
    {
      label: "Version",
      value: isPublished && currentVersion ? currentVersion : `${nextVersion} (projet)`,
    },
    ...(approverName
      ? [
          { label: "Approuvée le", value: fmt(approvedAt ?? currentVersionDate) },
          { label: "Signataire", value: approverName },
        ]
      : []),
    ...(drafterName ? [{ label: "Rédacteur", value: drafterName }] : []),
  ];

  function handleChange(c: JSONContent) {
    contenuRef.current = c;
    dirtyRef.current = true;
    setSaved(false);
  }

  async function persist(): Promise<boolean> {
    const result = await savePolitiqueContenuAction((contenuRef.current ?? {}) as never);
    if (result.ok) {
      dirtyRef.current = false;
      setSaved(true);
      return true;
    }
    toast.error(result.error);
    return false;
  }

  // Sauvegarde automatique tant qu'on est en brouillon
  useEffect(() => {
    if (!editable) return;
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      const result = await savePolitiqueContenuAction((contenuRef.current ?? {}) as never);
      if (result.ok) {
        dirtyRef.current = false;
        setSaved(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [editable]);

  async function save() {
    setPending(true);
    if (await persist()) toast.success("Politique enregistrée.");
    setPending(false);
  }

  async function publish() {
    setPending(true);
    const result = await publishPolitiqueAction();
    setPending(false);
    if (result.ok) {
      toast.success("Politique publiée. Version figée créée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function transition(target: string, message: string) {
    setPending(true);
    // Toujours sauvegarder le contenu en cours avant de changer de statut
    if (editable && dirtyRef.current && !(await persist())) {
      setPending(false);
      return;
    }
    const result = await transitionPolitiqueStatutAction(target);
    setPending(false);
    if (result.ok) {
      toast.success(message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Statut</span>
          <Badge variant="secondary">{STATUT_LABELS[statut] ?? statut}</Badge>
          {isPublished && currentVersion ? (
            <span className="text-muted-foreground text-sm">
              · {currentVersion}
              {currentVersionDate ? ` · publiée le ${fmt(currentVersionDate)}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              · version en cours {nextVersion} (non publiée)
              {currentVersion
                ? ` · dernière publiée : ${currentVersion}${
                    currentVersionDate ? ` le ${fmt(currentVersionDate)}` : ""
                  }`
                : ""}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/print/politique" target="_blank">
                Aperçu / PDF
              </Link>
            }
          />
          {editable ? (
            <>
              {saved ? (
                <span className="self-center text-muted-foreground text-xs">Enregistré ✓</span>
              ) : null}
              <Button onClick={save} disabled={pending} variant="outline">
                Enregistrer
              </Button>
            </>
          ) : null}

          {statut === "brouillon" && canWrite ? (
            <Button
              onClick={() => transition("en_revue", "Soumise à approbation.")}
              disabled={pending}
            >
              Soumettre à approbation
            </Button>
          ) : null}
          {statut === "en_revue" && canApprove ? (
            <>
              <Button
                variant="outline"
                onClick={() => transition("brouillon", "Renvoyée en brouillon.")}
                disabled={pending}
              >
                Demander des modifications
              </Button>
              <SignatureCapture
                triggerLabel="Approuver et signer"
                title="Approuver la politique qualité"
                description="Signez avec votre mot de passe pour approuver ce document."
                onSigned={() => transition("approuvee", "Politique approuvée et signée.")}
              />
            </>
          ) : null}
          {statut === "approuvee" && canApprove ? (
            <Button onClick={publish} disabled={pending}>
              Publier
            </Button>
          ) : null}
          {statut === "publiee" && canWrite ? (
            <Button
              variant="outline"
              onClick={() => transition("brouillon", "Nouvelle version en brouillon.")}
              disabled={pending}
            >
              Créer une nouvelle version
            </Button>
          ) : null}
        </div>
      </div>

      {drafterName || approverName ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
          {drafterName ? <span>Rédigé par {drafterName}</span> : null}
          {approverName ? (
            <span>
              Validé et signé par {approverName}
              {approvedAt ? ` le ${new Date(approvedAt).toLocaleDateString("fr-FR")}` : ""}
            </span>
          ) : null}
        </div>
      ) : null}

      {statut === "approuvee" ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">Approuvée, non encore publiée.</span>{" "}
          <span className="text-muted-foreground">
            Cette version deviendra officiellement {nextVersion} une fois
            {canApprove ? " que vous aurez cliqué « Publier »." : " publiée par un approbateur."}
            {currentVersion ? ` En attendant, la version en vigueur reste ${currentVersion}.` : ""}
          </span>
        </div>
      ) : null}

      {editable ? (
        <TiptapEditor key={statut} content={initialContenu} editable onChange={handleChange} />
      ) : (
        <>
          <DocumentPaper
            surtitre="Document maîtrisé"
            titre="Politique qualité"
            societe={societe}
            meta={documentMeta}
            className="border"
          >
            <TiptapEditor content={initialContenu} editable={false} bare />
          </DocumentPaper>
          <p className="text-muted-foreground text-xs">
            La politique n'est modifiable qu'en statut « Brouillon ». Utilisez « Aperçu / PDF » pour
            l'imprimer.
          </p>
        </>
      )}
    </div>
  );
}
