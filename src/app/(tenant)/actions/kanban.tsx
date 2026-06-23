"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { setActionStatutAction } from "@/lib/actions/plan-actions";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { ACTION_PRIORITE_LABELS, ACTION_STATUT_LABELS, ACTION_STATUTS } from "@/lib/labels";
import type { ActionRow } from "./action-dialog";

type Statut = (typeof ACTION_STATUTS)[number];

export type KanbanAction = ActionRow & { reference: string };

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : null;
}

const PRIORITE_DOT: Record<string, string> = {
  p1: "bg-status-nc-mineure",
  p2: "bg-status-pa",
  p3: "bg-status-conforme",
};

function Card({ action, readOnly }: { action: KanbanAction; readOnly: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={readOnly ? undefined : setNodeRef}
      style={readOnly ? undefined : style}
      className={`group relative rounded-xl bg-card shadow-soft ring-1 ring-foreground/5 transition-shadow hover:ring-foreground/10 ${isDragging ? "opacity-60" : ""}`}
    >
      {/* En lecture seule (auditeur) : pas de drag, contenu statique. */}
      <div
        {...(readOnly ? {} : listeners)}
        {...(readOnly ? {} : attributes)}
        className={`px-3.5 py-3 pr-9 text-sm ${readOnly ? "" : "cursor-grab touch-none active:cursor-grabbing"}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${PRIORITE_DOT[action.priorite] ?? "bg-muted-foreground"}`}
          />
          <span className="font-medium text-[11px] text-muted-foreground">
            {ACTION_PRIORITE_LABELS[action.priorite as keyof typeof ACTION_PRIORITE_LABELS]}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70">{action.reference}</span>
        </div>
        <p className="mt-1.5 font-medium leading-snug">{action.description_courte}</p>
        {formatDate(action.date_prevue) ? (
          <p className="mt-2 text-muted-foreground text-xs">
            Échéance {formatDate(action.date_prevue)}
          </p>
        ) : null}
      </div>
      <Link
        href={`/actions/${action.id}`}
        aria-label="Ouvrir la fiche"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
      >
        <ArrowUpRight className="size-4" />
      </Link>
    </div>
  );
}

function Column({
  statut,
  actions,
  readOnly,
}: {
  statut: Statut;
  actions: KanbanAction[];
  readOnly: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statut });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1.5">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {ACTION_STATUT_LABELS[statut]}
        </span>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-muted-foreground text-xs">
          {actions.length}
        </span>
      </div>
      <div
        ref={readOnly ? undefined : setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2.5 rounded-2xl p-2.5 transition-colors ${
          !readOnly && isOver ? "bg-primary/5 ring-1 ring-primary/30" : "bg-foreground/[0.025]"
        }`}
      >
        {actions.map((a) => (
          <Card key={a.id} action={a} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}

export function ActionsKanban({ initial }: { initial: KanbanAction[] }) {
  const [items, setItems] = useState(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const readOnly = useReadOnly();

  async function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const target = event.over?.id ? (String(event.over.id) as Statut) : null;
    if (!target) return;

    const current = items.find((a) => a.id === id);
    if (!current || current.statut === target) return;

    const previous = items;
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, statut: target } : a)));

    const result = await setActionStatutAction({ id, statut: target });
    if (!result.ok) {
      setItems(previous);
      toast.error(result.error);
    }
  }

  // En lecture seule (auditeur) : on n'enveloppe pas dans un DndContext et on ne
  // câble aucun handler de déplacement ; les cartes restent visibles et cliquables.
  if (readOnly) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ACTION_STATUTS.map((statut) => (
          <Column
            key={statut}
            statut={statut}
            actions={items.filter((a) => a.statut === statut)}
            readOnly
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ACTION_STATUTS.map((statut) => (
          <Column
            key={statut}
            statut={statut}
            actions={items.filter((a) => a.statut === statut)}
            readOnly={false}
          />
        ))}
      </div>
    </DndContext>
  );
}
