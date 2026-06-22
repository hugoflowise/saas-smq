"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveContexteAction } from "@/lib/actions/contexte";

type Swot = { forces: string[]; faiblesses: string[]; opportunites: string[]; menaces: string[] };
type Pestel = {
  politique: string[];
  economique: string[];
  sociologique: string[];
  technologique: string[];
  ecologique: string[];
  legal: string[];
};

// SWOT : 2×2 coloré. dot = pastille de couleur, accent = teinte de la bordure.
const SWOT_FIELDS: { key: keyof Swot; label: string; dot: string; accent: string }[] = [
  {
    key: "forces",
    label: "Forces",
    dot: "bg-status-conforme",
    accent: "border-status-conforme/40",
  },
  {
    key: "faiblesses",
    label: "Faiblesses",
    dot: "bg-status-nc-mineure",
    accent: "border-status-nc-mineure/40",
  },
  {
    key: "opportunites",
    label: "Opportunités",
    dot: "bg-status-pf",
    accent: "border-status-pf/40",
  },
  { key: "menaces", label: "Menaces", dot: "bg-status-pa", accent: "border-status-pa/40" },
];

const PESTEL_FIELDS: { key: keyof Pestel; label: string; lettre: string }[] = [
  { key: "politique", label: "Politique", lettre: "P" },
  { key: "economique", label: "Économique", lettre: "É" },
  { key: "sociologique", label: "Sociologique", lettre: "S" },
  { key: "technologique", label: "Technologique", lettre: "T" },
  { key: "ecologique", label: "Écologique", lettre: "E" },
  { key: "legal", label: "Légal", lettre: "L" },
];

/** Liste éditable de points : une ligne par point, ajout/suppression. */
function PointList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: points ordonnés sans id stable
          key={i}
          className="flex items-center gap-1"
        >
          <span className="text-muted-foreground text-xs">•</span>
          <Input
            value={item}
            placeholder={placeholder}
            className="h-8"
            onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Retirer le point"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1 self-start text-primary text-xs hover:underline"
      >
        <Plus className="size-3.5" />
        Ajouter un point
      </button>
    </div>
  );
}

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

  // Nettoie les points vides avant envoi.
  const clean = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

  async function save() {
    setPending(true);
    const result = await saveContexteAction({
      swot: {
        forces: clean(swot.forces),
        faiblesses: clean(swot.faiblesses),
        opportunites: clean(swot.opportunites),
        menaces: clean(swot.menaces),
      },
      pestel: {
        politique: clean(pestel.politique),
        economique: clean(pestel.economique),
        sociologique: clean(pestel.sociologique),
        technologique: clean(pestel.technologique),
        ecologique: clean(pestel.ecologique),
        legal: clean(pestel.legal),
      },
      dateRevue,
      prochainRevue,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Contexte enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 font-semibold text-sm">Analyse SWOT</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SWOT_FIELDS.map((f) => (
            <div
              key={f.key}
              className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${f.accent}`}
            >
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${f.dot}`} />
                <Label className="font-semibold">{f.label}</Label>
                <span className="ml-auto text-muted-foreground text-xs">
                  {clean(swot[f.key]).length}
                </span>
              </div>
              <PointList
                items={swot[f.key]}
                placeholder={`${f.label}…`}
                onChange={(items) => setSwot((s) => ({ ...s, [f.key]: items }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-sm">Analyse PESTEL</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PESTEL_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary text-xs">
                  {f.lettre}
                </span>
                <Label className="font-semibold">{f.label}</Label>
                <span className="ml-auto text-muted-foreground text-xs">
                  {clean(pestel[f.key]).length}
                </span>
              </div>
              <PointList
                items={pestel[f.key]}
                placeholder={`${f.label}…`}
                onChange={(items) => setPestel((p) => ({ ...p, [f.key]: items }))}
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
