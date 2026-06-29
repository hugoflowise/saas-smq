"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getJustificatifUrlAction } from "@/lib/actions/competences";

/** Lien de téléchargement de la pièce justificative (URL signée à la demande). */
export function JustificatifLink({ id, nom }: { id: string; nom: string }) {
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    const r = await getJustificatifUrlAction(id);
    setPending(false);
    if (r.ok) window.open(r.url, "_blank", "noopener");
    else toast.error(r.error);
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      className="inline-flex items-center gap-1 text-primary text-xs hover:underline disabled:opacity-50"
    >
      <Download className="size-3.5" />
      <span className="max-w-32 truncate">{nom}</span>
    </button>
  );
}
