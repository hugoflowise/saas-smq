"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveNcCausesAction } from "@/lib/actions/nc";

export type CausesInitial = {
  probleme: string;
  pourquoi: string[];
  causeRacine: string;
};

const NB_POURQUOI = 5;

export function NcCauses({ ncId, initial }: { ncId: string; initial: CausesInitial }) {
  const router = useRouter();
  const [probleme, setProbleme] = useState(initial.probleme);
  const [pourquoi, setPourquoi] = useState<string[]>(
    Array.from({ length: NB_POURQUOI }, (_, i) => initial.pourquoi[i] ?? ""),
  );
  const [causeRacine, setCauseRacine] = useState(initial.causeRacine);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    const result = await saveNcCausesAction({ id: ncId, probleme, pourquoi, causeRacine });
    setPending(false);
    if (result.ok) {
      toast.success("Analyse des causes enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="probleme">Problème constaté</Label>
        <Textarea
          id="probleme"
          rows={2}
          value={probleme}
          onChange={(e) => setProbleme(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium text-sm">Les 5 pourquoi</p>
        {pourquoi.map((value, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: liste fixe et ordonnée
          <div key={i} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-muted-foreground text-sm">Pourquoi {i + 1}</span>
            <Input
              value={value}
              onChange={(e) =>
                setPourquoi((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
              }
              placeholder={i === 0 ? "Pourquoi le problème est-il survenu ?" : "…parce que ?"}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="causeRacine">Cause racine identifiée</Label>
        <Textarea
          id="causeRacine"
          rows={2}
          value={causeRacine}
          onChange={(e) => setCauseRacine(e.target.value)}
        />
      </div>

      <div>
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'analyse"}
        </Button>
      </div>
    </div>
  );
}
