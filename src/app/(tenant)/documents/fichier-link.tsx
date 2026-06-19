"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getDocumentFichierUrlAction } from "@/lib/actions/documents-maitrise";

export function FichierLink({ id, nom }: { id: string; nom: string }) {
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    const r = await getDocumentFichierUrlAction(id);
    setPending(false);
    if (r.ok) window.open(r.url, "_blank", "noopener");
    else toast.error(r.error);
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
      title={nom}
    >
      <Download className="size-3.5" />
      <span className="max-w-32 truncate">{nom}</span>
    </button>
  );
}
