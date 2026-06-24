"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FicheProcessus, type FicheProcessusData } from "@/components/fiche-processus";
import { SignatureCapture } from "@/components/signature-capture";
import { Button } from "@/components/ui/button";
import { approveFicheProcessusAction } from "@/lib/actions/processus-fiche";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { FicheEditor, type FicheEditorInitial } from "./fiche-editor";

export function FicheClient({
  data,
  initial,
  canWrite,
  canApprove,
  isApproved,
  printHref,
}: {
  data: FicheProcessusData;
  initial: FicheEditorInitial;
  canWrite: boolean;
  canApprove: boolean;
  isApproved: boolean;
  printHref: string;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [editing, setEditing] = useState(false);

  async function approve() {
    const r = await approveFicheProcessusAction(initial.id);
    if (r.ok) {
      toast.success("Fiche approuvée et signée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  if (editing) {
    return <FicheEditor initial={initial} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href={printHref} target="_blank">
              Aperçu / PDF
            </Link>
          }
        />
        {canWrite && !readOnly ? (
          <Button onClick={() => setEditing(true)}>Modifier la fiche</Button>
        ) : null}
        {canApprove && !readOnly && !isApproved ? (
          <SignatureCapture
            triggerLabel="Approuver et signer"
            title="Approuver la fiche d'identité"
            description="Signez avec votre mot de passe pour approuver ce document."
            onSigned={approve}
          />
        ) : null}
      </div>
      <FicheProcessus {...data} />
    </div>
  );
}
