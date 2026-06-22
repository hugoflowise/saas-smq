"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMotsClesVeilleAction } from "@/lib/actions/veille-suggestions";

/** Configuration des mots-clés de veille (filtrage des textes officiels). */
export function VeilleMotsCles({ initial }: { initial: string }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(initial);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const r = await setMotsClesVeilleAction(valeur);
    setPending(false);
    if (r.ok) {
      toast.success("Mots-clés de veille enregistrés.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="motscles" className="text-muted-foreground text-xs">
          Mots-clés de veille (séparés par des virgules) : les nouveaux textes officiels
          correspondants vous seront proposés.
        </label>
        <Input
          id="motscles"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder="sécurité au travail, EPI, environnement, RGPD…"
        />
      </div>
      <Button onClick={save} disabled={pending} variant="outline">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
