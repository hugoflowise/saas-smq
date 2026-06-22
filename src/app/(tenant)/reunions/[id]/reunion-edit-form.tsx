"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateReunionAction } from "@/lib/actions/reunions";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type Point = {
  sujet: string;
  prepa: string;
  discussion: string;
  decision: string;
  statut: string;
};

export type ReunionDetail = {
  id: string;
  titre: string;
  type: string;
  date_prevue: string | null;
  date_realisation: string | null;
  lieu: string | null;
  animateur: string | null;
  objectifs: string | null;
  convoques: string | null;
  presents: string | null;
  synthese: string | null;
  statut: string;
  points: Point[];
};

const STATUT_POINT = [
  { v: "a_voir", l: "À voir" },
  { v: "traite", l: "Traité" },
  { v: "reporte", l: "Reporté" },
];

export function ReunionEditForm({ reunion }: { reunion: ReunionDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [points, setPoints] = useState<Point[]>(reunion.points ?? []);

  function updatePoint(i: number, patch: Partial<Point>) {
    setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addPoint() {
    setPoints((prev) => [
      ...prev,
      { sujet: "", prepa: "", discussion: "", decision: "", statut: "a_voir" },
    ]);
  }
  function removePoint(i: number) {
    setPoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await updateReunionAction({
      id: reunion.id,
      titre: f.get("titre"),
      type: f.get("type"),
      datePrevue: f.get("datePrevue") || undefined,
      dateRealisation: f.get("dateRealisation") || undefined,
      lieu: f.get("lieu") || undefined,
      animateur: f.get("animateur") || undefined,
      objectifs: f.get("objectifs") || undefined,
      convoques: f.get("convoques") || undefined,
      presents: f.get("presents") || undefined,
      synthese: f.get("synthese") || undefined,
      statut: f.get("statut"),
      points: points.filter((p) => p.sujet.trim()),
    });
    setPending(false);
    if (result.ok) {
      toast.success("Réunion enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="titre">Titre</Label>
          <Input id="titre" name="titre" required defaultValue={reunion.titre} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className={SELECT_CLASS} defaultValue={reunion.type}>
            <option value="comite_qhse">Comité QHSE</option>
            <option value="reunion_echange">Réunion d'échange</option>
            <option value="revue">Revue</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="statut">Statut</Label>
          <select id="statut" name="statut" className={SELECT_CLASS} defaultValue={reunion.statut}>
            <option value="planifiee">Planifiée</option>
            <option value="terminee">Terminée</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="datePrevue">Date prévue</Label>
          <Input
            id="datePrevue"
            name="datePrevue"
            type="date"
            defaultValue={reunion.date_prevue ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateRealisation">Date de réalisation</Label>
          <Input
            id="dateRealisation"
            name="dateRealisation"
            type="date"
            defaultValue={reunion.date_realisation ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lieu">Lieu</Label>
          <Input
            id="lieu"
            name="lieu"
            defaultValue={reunion.lieu ?? ""}
            placeholder="Visio, salle…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="animateur">Animateur</Label>
          <Input id="animateur" name="animateur" defaultValue={reunion.animateur ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="objectifs">Objectifs de la réunion</Label>
        <Textarea id="objectifs" name="objectifs" rows={2} defaultValue={reunion.objectifs ?? ""} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="convoques">Convoqués</Label>
          <Textarea
            id="convoques"
            name="convoques"
            rows={3}
            defaultValue={reunion.convoques ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="presents">Présents</Label>
          <Textarea id="presents" name="presents" rows={3} defaultValue={reunion.presents ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Ordre du jour</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addPoint}>
            <Plus className="size-4" />
            Ajouter un point
          </Button>
        </div>
        {points.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun point. Ajoutez l'ordre du jour.</p>
        ) : (
          points.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: points ordonnés sans id stable
            <div key={i} className="flex flex-col gap-2 rounded-xl border bg-surface p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={p.sujet}
                  onChange={(e) => updatePoint(i, { sujet: e.target.value })}
                  placeholder={`Point ${i + 1} : sujet`}
                  className="h-8 font-medium"
                />
                <select
                  value={p.statut}
                  onChange={(e) => updatePoint(i, { statut: e.target.value })}
                  className="h-8 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {STATUT_POINT.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Retirer le point"
                  onClick={() => removePoint(i)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Textarea
                  value={p.discussion}
                  onChange={(e) => updatePoint(i, { discussion: e.target.value })}
                  rows={2}
                  placeholder="Discussion"
                />
                <Textarea
                  value={p.decision}
                  onChange={(e) => updatePoint(i, { decision: e.target.value })}
                  rows={2}
                  placeholder="Décision"
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="synthese">Synthèse</Label>
        <Textarea id="synthese" name="synthese" rows={3} defaultValue={reunion.synthese ?? ""} />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la réunion"}
        </Button>
      </div>
    </form>
  );
}
