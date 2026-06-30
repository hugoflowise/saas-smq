"use client";

import { ArrowDown, ArrowUp, Lock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  resetFormulaireModeleAction,
  saveFormulaireModeleAction,
} from "@/lib/actions/formulaire-modeles";
import type { FormulaireType } from "@/lib/formulaire-modeles";
import type { Champ, ChampType, SectionConfig } from "@/lib/suivi-consultant";
import { SELECT_CLASS } from "@/lib/ui-classes";

const TYPE_LABELS: Record<ChampType, string> = {
  text: "Texte court",
  email: "Adresse e-mail",
  textarea: "Texte long",
  date: "Date",
  single: "Choix unique",
  multi: "Choix multiple",
  note5: "Note sur 5",
  nps: "Recommandation (0–10)",
};

/** Section d'édition : on ajoute un id stable pour les clés React (rename sans perte de focus). */
type EditSection = { id: string; title: string; champs: Champ[] };

function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function toEdit(sections: SectionConfig[]): EditSection[] {
  return sections.map((s) => ({
    id: uid("sec"),
    title: s.title,
    champs: s.champs.map((c) => ({ ...c })),
  }));
}

const hasOptions = (t: ChampType) => t === "single" || t === "multi";

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function FormulaireEditor({
  type,
  initialSections,
  personnalise,
}: {
  type: FormulaireType;
  initialSections: SectionConfig[];
  personnalise: boolean;
}) {
  const router = useRouter();
  const [sections, setSections] = useState<EditSection[]>(() => toEdit(initialSections));
  const [pending, setPending] = useState(false);

  function patchSection(idx: number, patch: Partial<EditSection>) {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function patchChamp(sIdx: number, cIdx: number, patch: Partial<Champ>) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? { ...s, champs: s.champs.map((c, j) => (j === cIdx ? { ...c, ...patch } : c)) }
          : s,
      ),
    );
  }

  function addChamp(sIdx: number) {
    const champ: Champ = { key: uid("libre"), label: "", type: "text" };
    setSections((prev) =>
      prev.map((s, i) => (i === sIdx ? { ...s, champs: [...s.champs, champ] } : s)),
    );
  }

  function removeChamp(sIdx: number, cIdx: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx ? { ...s, champs: s.champs.filter((_, j) => j !== cIdx) } : s,
      ),
    );
  }

  function moveChamp(sIdx: number, cIdx: number, dir: -1 | 1) {
    setSections((prev) =>
      prev.map((s, i) => (i === sIdx ? { ...s, champs: move(s.champs, cIdx, cIdx + dir) } : s)),
    );
  }

  function addSection() {
    setSections((prev) => [...prev, { id: uid("sec"), title: "Nouvelle section", champs: [] }]);
  }

  function removeSection(sIdx: number) {
    if (sections[sIdx].champs.some((c) => c.verrou)) {
      toast.error(
        "Cette section contient une question essentielle : déplacez-la avant de supprimer la section.",
      );
      return;
    }
    setSections((prev) => prev.filter((_, i) => i !== sIdx));
  }

  function moveSection(sIdx: number, dir: -1 | 1) {
    setSections((prev) => move(prev, sIdx, sIdx + dir));
  }

  async function handleSave() {
    // Validation légère avant envoi (l'action revalide tout côté serveur).
    for (const s of sections) {
      if (!s.title.trim()) return toast.error("Chaque section doit avoir un titre.");
      for (const c of s.champs) {
        if (!c.label.trim())
          return toast.error(`Une question de « ${s.title} » n'a pas de libellé.`);
        if (hasOptions(c.type) && !(c.options ?? []).some((o) => o.trim())) {
          return toast.error(`« ${c.label} » est un choix mais n'a aucune option.`);
        }
      }
    }

    const definition = sections.map((s) => ({
      title: s.title.trim(),
      champs: s.champs.map((c) => ({
        ...c,
        label: c.label.trim(),
        options: hasOptions(c.type)
          ? (c.options ?? []).map((o) => o.trim()).filter(Boolean)
          : undefined,
      })),
    }));

    setPending(true);
    const result = await saveFormulaireModeleAction({ type, definition });
    setPending(false);
    if (result.ok) {
      toast.success("Formulaire enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleReset() {
    if (
      !confirm("Revenir au formulaire standard ? Votre personnalisation actuelle sera désactivée.")
    ) {
      return;
    }
    setPending(true);
    const result = await resetFormulaireModeleAction(type);
    setPending(false);
    if (result.ok) {
      toast.success("Formulaire réinitialisé au modèle standard.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, sIdx) => (
        <Card key={section.id}>
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground text-sm">{sIdx + 1}.</span>
              <Input
                value={section.title}
                onChange={(e) => patchSection(sIdx, { title: e.target.value })}
                className="font-medium"
                aria-label="Titre de la section"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveSection(sIdx, -1)}
                disabled={sIdx === 0}
                aria-label="Monter la section"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveSection(sIdx, 1)}
                disabled={sIdx === sections.length - 1}
                aria-label="Descendre la section"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSection(sIdx)}
                aria-label="Supprimer la section"
              >
                <Trash2 className="size-4 text-status-nc-mineure" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 border-border border-l-2 pl-3">
              {section.champs.map((champ, cIdx) => (
                <div
                  key={champ.key}
                  className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <Input
                        value={champ.label}
                        onChange={(e) => patchChamp(sIdx, cIdx, { label: e.target.value })}
                        placeholder="Libellé de la question"
                      />
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {champ.verrou ? (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-muted-foreground text-xs">
                            <Lock className="size-3" /> {TYPE_LABELS[champ.type]} · essentielle
                          </span>
                        ) : (
                          <select
                            value={champ.type}
                            onChange={(e) =>
                              patchChamp(sIdx, cIdx, {
                                type: e.target.value as ChampType,
                                options: hasOptions(e.target.value as ChampType)
                                  ? (champ.options ?? ["", ""])
                                  : undefined,
                              })
                            }
                            className={SELECT_CLASS}
                            aria-label="Type de question"
                          >
                            {Object.entries(TYPE_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        )}
                        {!champ.verrou ? (
                          <label className="flex items-center gap-1.5 text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={champ.required ?? false}
                              onChange={(e) =>
                                patchChamp(sIdx, cIdx, { required: e.target.checked })
                              }
                            />
                            Obligatoire
                          </label>
                        ) : champ.required ? (
                          <span className="text-muted-foreground text-xs">Obligatoire</span>
                        ) : null}
                      </div>
                      {hasOptions(champ.type) && !champ.verrou ? (
                        <div className="flex flex-col gap-1">
                          <Label className="text-muted-foreground text-xs">
                            Options (une par ligne)
                          </Label>
                          <Textarea
                            rows={3}
                            value={(champ.options ?? []).join("\n")}
                            onChange={(e) =>
                              patchChamp(sIdx, cIdx, { options: e.target.value.split("\n") })
                            }
                            placeholder={"Option 1\nOption 2"}
                          />
                        </div>
                      ) : null}
                      {hasOptions(champ.type) && champ.verrou ? (
                        <p className="text-muted-foreground text-xs">
                          Options : {(champ.options ?? []).join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveChamp(sIdx, cIdx, -1)}
                        disabled={cIdx === 0}
                        aria-label="Monter"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveChamp(sIdx, cIdx, 1)}
                        disabled={cIdx === section.champs.length - 1}
                        aria-label="Descendre"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      {champ.verrou ? (
                        <span
                          className="flex size-9 items-center justify-center"
                          title="Question essentielle, non supprimable"
                        >
                          <Lock className="size-4 text-muted-foreground" />
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChamp(sIdx, cIdx)}
                          aria-label="Supprimer la question"
                        >
                          <Trash2 className="size-4 text-status-nc-mineure" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 self-start"
                onClick={() => addChamp(sIdx)}
              >
                <Plus className="size-4" /> Ajouter une question
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="gap-2 self-start" onClick={addSection}>
        <Plus className="size-4" /> Ajouter une section
      </Button>

      <div className="sticky bottom-4 mt-2 flex items-center gap-3 rounded-xl border bg-card/95 p-3 shadow-soft backdrop-blur">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le formulaire"}
        </Button>
        {personnalise ? (
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={handleReset}
            disabled={pending}
          >
            <RotateCcw className="size-4" /> Revenir au modèle standard
          </Button>
        ) : null}
      </div>
    </div>
  );
}
