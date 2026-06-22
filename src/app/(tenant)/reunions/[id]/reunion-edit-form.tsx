"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

/** Statuts d'un point de l'ordre du jour, avec couleur (vert = traité, etc.). */
const STATUT_POINT: Record<string, { label: string; badge: string; border: string }> = {
  a_voir: {
    label: "À voir",
    badge: "bg-muted text-muted-foreground",
    border: "border-l-muted-foreground/30",
  },
  traite: {
    label: "Traité",
    badge: "bg-status-conforme/15 text-status-conforme",
    border: "border-l-status-conforme",
  },
  reporte: {
    label: "Reporté",
    badge: "bg-status-pa/15 text-status-pa",
    border: "border-l-status-pa",
  },
};
const STATUT_ORDRE = ["a_voir", "traite", "reporte"];

export function ReunionEditForm({ reunion }: { reunion: ReunionDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [points, setPoints] = useState<Point[]>(reunion.points ?? []);

  const traites = points.filter((p) => p.statut === "traite").length;

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
      <Tabs defaultValue="preparation">
        <TabsList>
          <TabsTrigger value="preparation">Préparation</TabsTrigger>
          <TabsTrigger value="deroulement" className="gap-1.5">
            Déroulement
            {points.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 font-medium text-[11px] text-muted-foreground">
                {traites}/{points.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Préparation */}
        <TabsContent value="preparation" keepMounted className="flex flex-col gap-6 pt-4">
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
              <Label htmlFor="datePrevue">Date prévue</Label>
              <Input
                id="datePrevue"
                name="datePrevue"
                type="date"
                defaultValue={reunion.date_prevue ?? ""}
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
            <Textarea
              id="objectifs"
              name="objectifs"
              rows={2}
              defaultValue={reunion.objectifs ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="convoques">Convoqués</Label>
            <Textarea
              id="convoques"
              name="convoques"
              rows={3}
              defaultValue={reunion.convoques ?? ""}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Ordre du jour</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addPoint}
              >
                <Plus className="size-4" />
                Ajouter un point
              </Button>
            </div>
            {points.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun point. Ajoutez les sujets à aborder : ils seront traités en séance dans
                l'onglet « Déroulement ».
              </p>
            ) : (
              points.map((p, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: points ordonnés sans id stable
                <div key={i} className="flex flex-col gap-2 rounded-xl border bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-muted-foreground text-xs">Point {i + 1}</span>
                    <Input
                      value={p.sujet}
                      onChange={(e) => updatePoint(i, { sujet: e.target.value })}
                      placeholder="Sujet à aborder"
                      className="h-8 font-medium"
                    />
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
                  <Textarea
                    value={p.prepa}
                    onChange={(e) => updatePoint(i, { prepa: e.target.value })}
                    rows={2}
                    placeholder="Notes de préparation (éléments à présenter, documents…)"
                  />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Déroulement (en séance) */}
        <TabsContent value="deroulement" keepMounted className="flex flex-col gap-6 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={reunion.statut}
              >
                <option value="planifiee">Planifiée</option>
                <option value="terminee">Terminée</option>
              </select>
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
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="presents">Présents</Label>
              <Textarea
                id="presents"
                name="presents"
                rows={2}
                defaultValue={reunion.presents ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Déroulement des points</Label>
            {points.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Ajoutez d'abord les points dans l'onglet « Préparation ».
              </p>
            ) : (
              points.map((p, i) => {
                const st = STATUT_POINT[p.statut] ?? STATUT_POINT.a_voir;
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: points ordonnés sans id stable
                    key={i}
                    className={`flex flex-col gap-2 rounded-xl border border-l-4 bg-surface p-3 ${st.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-muted-foreground text-xs">Point {i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {p.sujet || <span className="text-muted-foreground">(sans sujet)</span>}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-medium text-xs ${st.badge}`}
                      >
                        {st.label}
                      </span>
                      <select
                        value={p.statut}
                        onChange={(e) => updatePoint(i, { statut: e.target.value })}
                        className="h-8 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm"
                        aria-label={`Statut du point ${i + 1}`}
                      >
                        {STATUT_ORDRE.map((v) => (
                          <option key={v} value={v}>
                            {STATUT_POINT[v].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {p.prepa ? (
                      <p className="text-muted-foreground text-xs">
                        <span className="font-medium">Prépa :</span> {p.prepa}
                      </p>
                    ) : null}
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
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="synthese">Synthèse</Label>
            <Textarea
              id="synthese"
              name="synthese"
              rows={3}
              defaultValue={reunion.synthese ?? ""}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la réunion"}
        </Button>
      </div>
    </form>
  );
}
