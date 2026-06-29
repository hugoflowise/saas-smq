"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addAuditQuestionAction,
  deleteAuditQuestionAction,
  updateAuditQuestionAction,
} from "@/lib/actions/audits-revues";
import { COTATION_BADGE_CLASS } from "@/lib/badges";
import { COTATION_LABELS } from "@/lib/labels";

const COTATION_OPTIONS: Record<string, string> = COTATION_LABELS;

const CONTROL =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

export type AuditQuestion = {
  id: string;
  reference_iso: string | null;
  question: string;
  reponse: string;
  constat: string | null;
};

function QuestionRow({ auditId, q }: { auditId: string; q: AuditQuestion }) {
  const router = useRouter();
  const [reponse, setReponse] = useState(q.reponse);
  const [constat, setConstat] = useState(q.constat ?? "");
  const [pending, startTransition] = useTransition();

  function saveReponse(next: string) {
    setReponse(next);
    startTransition(async () => {
      const r = await updateAuditQuestionAction({ id: q.id, auditId, reponse: next });
      if (!r.ok) {
        toast.error(r.error);
        setReponse(q.reponse);
      }
    });
  }

  function saveConstat() {
    if (constat === (q.constat ?? "")) return;
    startTransition(async () => {
      const r = await updateAuditQuestionAction({ id: q.id, auditId, constat });
      if (!r.ok) toast.error(r.error);
    });
  }

  async function remove() {
    const r = await deleteAuditQuestionAction(q.id, auditId);
    if (r.ok) router.refresh();
    else toast.error(r.error);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-surface p-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        {q.reference_iso ? (
          <span className="font-mono text-muted-foreground text-xs">{q.reference_iso}</span>
        ) : null}
        <p className="font-medium text-sm">{q.question}</p>
        <Input
          value={constat}
          onChange={(e) => setConstat(e.target.value)}
          onBlur={saveConstat}
          disabled={pending}
          placeholder="Constat / observation…"
          className="mt-2 h-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={reponse}
          onChange={(e) => saveReponse(e.target.value)}
          disabled={pending}
          className={`${CONTROL} font-medium ${reponse !== "non_evalue" ? (COTATION_BADGE_CLASS[reponse] ?? "") : ""}`}
          aria-label="Réponse"
        >
          {Object.entries(COTATION_OPTIONS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={remove}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function AuditGrille({
  auditId,
  questions,
}: {
  auditId: string;
  questions: AuditQuestion[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const r = await addAuditQuestionAction({
      auditId,
      question: f.get("question"),
      referenceIso: f.get("referenceIso") || undefined,
    });
    setPending(false);
    if (r.ok) {
      setAdding(false);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucune question. Ajoutez les points de contrôle de l'audit.
        </p>
      ) : (
        questions.map((q) => <QuestionRow key={q.id} auditId={auditId} q={q} />)
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-lg border p-3">
          <Input name="referenceIso" placeholder="Réf. ISO (ex. 8.4) · optionnel" className="h-8" />
          <Input name="question" required placeholder="Point de contrôle / question d'audit" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              Ajouter
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="w-fit gap-2" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Ajouter une question
        </Button>
      )}
    </div>
  );
}
