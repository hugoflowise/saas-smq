"use client";

import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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
};

export function PolitiqueClient({ initialContenu, statut }: Props) {
  const router = useRouter();
  const [contenu, setContenu] = useState<JSONContent | null>(initialContenu);
  const [pending, setPending] = useState(false);
  const editable = statut === "brouillon";

  async function save() {
    setPending(true);
    const result = await savePolitiqueContenuAction((contenu ?? {}) as never);
    setPending(false);
    if (result.ok) {
      toast.success("Politique enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function transition(target: string, message: string) {
    setPending(true);
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
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Statut</span>
          <Badge variant="secondary">{STATUT_LABELS[statut] ?? statut}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {editable ? (
            <Button onClick={save} disabled={pending} variant="outline">
              Enregistrer
            </Button>
          ) : null}

          {statut === "brouillon" ? (
            <Button
              onClick={() => transition("en_revue", "Soumise à approbation.")}
              disabled={pending}
            >
              Soumettre à approbation
            </Button>
          ) : null}
          {statut === "en_revue" ? (
            <>
              <Button
                variant="outline"
                onClick={() => transition("brouillon", "Renvoyée en brouillon.")}
                disabled={pending}
              >
                Demander des modifications
              </Button>
              <Button
                onClick={() => transition("approuvee", "Politique approuvée.")}
                disabled={pending}
              >
                Approuver
              </Button>
            </>
          ) : null}
          {statut === "approuvee" ? (
            <Button onClick={() => transition("publiee", "Politique publiée.")} disabled={pending}>
              Publier
            </Button>
          ) : null}
          {statut === "publiee" ? (
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

      <TiptapEditor
        key={statut}
        content={initialContenu}
        editable={editable}
        onChange={setContenu}
      />

      {!editable ? (
        <p className="text-muted-foreground text-xs">
          La politique n'est modifiable qu'en statut « Brouillon ».
        </p>
      ) : null}
    </div>
  );
}
