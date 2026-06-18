"use client";

import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SignatureCapture } from "@/components/signature-capture";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  publishProcedureAction,
  saveProcedureContenuAction,
  transitionProcedureStatutAction,
} from "@/lib/actions/procedures";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
};

type Props = {
  id: string;
  initialContenu: JSONContent | null;
  statut: string;
  currentVersion: string | null;
  currentVersionDate: string | null;
  canWrite: boolean;
  canApprove: boolean;
  drafterName: string | null;
  approverName: string | null;
  approvedAt: string | null;
};

export function ProcedureClient({
  id,
  initialContenu,
  statut,
  currentVersion,
  currentVersionDate,
  canWrite,
  canApprove,
  drafterName,
  approverName,
  approvedAt,
}: Props) {
  const router = useRouter();
  const contenuRef = useRef<JSONContent | null>(initialContenu);
  const dirtyRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const editable = statut === "brouillon" && canWrite;

  function handleChange(c: JSONContent) {
    contenuRef.current = c;
    dirtyRef.current = true;
    setSaved(false);
  }

  async function persist(): Promise<boolean> {
    const result = await saveProcedureContenuAction(id, (contenuRef.current ?? {}) as never);
    if (result.ok) {
      dirtyRef.current = false;
      setSaved(true);
      return true;
    }
    toast.error(result.error);
    return false;
  }

  useEffect(() => {
    if (!editable) return;
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      const result = await saveProcedureContenuAction(id, (contenuRef.current ?? {}) as never);
      if (result.ok) {
        dirtyRef.current = false;
        setSaved(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [editable, id]);

  async function save() {
    setPending(true);
    if (await persist()) toast.success("Procédure enregistrée.");
    setPending(false);
  }

  async function publish() {
    setPending(true);
    const result = await publishProcedureAction(id);
    setPending(false);
    if (result.ok) {
      toast.success("Procédure publiée. Version figée créée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function transition(target: string, message: string) {
    setPending(true);
    if (editable && dirtyRef.current && !(await persist())) {
      setPending(false);
      return;
    }
    const result = await transitionProcedureStatutAction(id, target);
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
          {currentVersion ? (
            <span className="text-muted-foreground text-sm">
              · {currentVersion}
              {currentVersionDate
                ? ` · publiée le ${new Date(currentVersionDate).toLocaleDateString("fr-FR")}`
                : ""}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/print/procedure/${id}`} target="_blank">
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
                title="Approuver la procédure"
                description="Signez avec votre mot de passe pour approuver ce document."
                onSigned={() => transition("approuvee", "Procédure approuvée et signée.")}
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

      <TiptapEditor
        key={statut}
        content={initialContenu}
        editable={editable}
        onChange={handleChange}
      />

      {!editable ? (
        <p className="text-muted-foreground text-xs">
          La procédure n'est modifiable qu'en statut « Brouillon ».
        </p>
      ) : null}
    </div>
  );
}
