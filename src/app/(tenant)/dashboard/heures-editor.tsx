"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setHeuresTravailleesAction } from "@/lib/actions/heures";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/** Saisie compacte des heures travaillées d'une année (dénominateur TF/TG). */
export function HeuresEditor({ annee, initial }: { annee: number; initial: number | null }) {
  const readOnly = useReadOnly();
  const [heures, setHeures] = useState(initial != null ? String(initial) : "");
  const [pending, setPending] = useState(false);

  if (readOnly) {
    return (
      <span className="text-muted-foreground text-xs">
        {initial != null
          ? `${initial.toLocaleString("fr-FR")} h en ${annee}`
          : `Heures ${annee} non saisies`}
      </span>
    );
  }

  async function save() {
    setPending(true);
    const r = await setHeuresTravailleesAction({ annee, heures });
    setPending(false);
    if (r.ok) toast.success("Heures travaillées enregistrées.");
    else toast.error(r.error);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="heures-annee" className="text-muted-foreground text-xs">
        Heures travaillées {annee}
      </label>
      <Input
        id="heures-annee"
        type="number"
        min={0}
        value={heures}
        onChange={(e) => setHeures(e.target.value)}
        className="h-8 w-32"
        placeholder="ex. 120000"
      />
      <Button size="sm" variant="outline" disabled={pending} onClick={save}>
        {pending ? "…" : "Enregistrer"}
      </Button>
    </div>
  );
}
