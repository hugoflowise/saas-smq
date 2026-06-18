"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveContexteAction } from "@/lib/actions/contexte";

type Swot = { forces: string; faiblesses: string; opportunites: string; menaces: string };
type Pestel = {
  politique: string;
  economique: string;
  sociologique: string;
  technologique: string;
  ecologique: string;
  legal: string;
};

const SWOT_FIELDS: { key: keyof Swot; label: string; cls: string }[] = [
  { key: "forces", label: "Forces", cls: "border-status-conforme/40" },
  { key: "faiblesses", label: "Faiblesses", cls: "border-status-nc-mineure/40" },
  { key: "opportunites", label: "Opportunités", cls: "border-status-pf/40" },
  { key: "menaces", label: "Menaces", cls: "border-status-pa/40" },
];

const PESTEL_FIELDS: { key: keyof Pestel; label: string }[] = [
  { key: "politique", label: "Politique" },
  { key: "economique", label: "Économique" },
  { key: "sociologique", label: "Sociologique" },
  { key: "technologique", label: "Technologique" },
  { key: "ecologique", label: "Écologique" },
  { key: "legal", label: "Légal" },
];

export function ContexteForm({
  initialSwot,
  initialPestel,
  initialDateRevue,
  initialProchainRevue,
}: {
  initialSwot: Swot;
  initialPestel: Pestel;
  initialDateRevue: string;
  initialProchainRevue: string;
}) {
  const router = useRouter();
  const [swot, setSwot] = useState(initialSwot);
  const [pestel, setPestel] = useState(initialPestel);
  const [dateRevue, setDateRevue] = useState(initialDateRevue);
  const [prochainRevue, setProchainRevue] = useState(initialProchainRevue);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const result = await saveContexteAction({ swot, pestel, dateRevue, prochainRevue });
    setPending(false);
    if (result.ok) {
      toast.success("Contexte enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 font-semibold text-sm">Analyse SWOT</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SWOT_FIELDS.map((f) => (
            <div key={f.key} className={`flex flex-col gap-1.5 rounded-lg border-2 p-3 ${f.cls}`}>
              <Label htmlFor={f.key}>{f.label}</Label>
              <Textarea
                id={f.key}
                rows={4}
                value={swot[f.key]}
                onChange={(e) => setSwot((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-sm">Analyse PESTEL</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PESTEL_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Textarea
                id={f.key}
                rows={3}
                value={pestel[f.key]}
                onChange={(e) => setPestel((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateRevue">Date de revue</Label>
          <Input
            id="dateRevue"
            type="date"
            className="w-44"
            value={dateRevue}
            onChange={(e) => setDateRevue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prochainRevue">Prochaine revue</Label>
          <Input
            id="prochainRevue"
            type="date"
            className="w-44"
            value={prochainRevue}
            onChange={(e) => setProchainRevue(e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le contexte"}
        </Button>
      </section>
    </div>
  );
}
