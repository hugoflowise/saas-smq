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
import { useState } from "react";
import { toast } from "sonner";
import { setActionStatutAction } from "@/lib/actions/plan-actions";
import { ACTION_PRIORITE_LABELS, ACTION_STATUT_LABELS, ACTION_STATUTS } from "@/lib/labels";

type Statut = (typeof ACTION_STATUTS)[number];

export type KanbanAction = {
  id: string;
  reference: string;
  description_courte: string;
  priorite: keyof typeof ACTION_PRIORITE_LABELS;
  statut: Statut;
  date_prevue: string | null;
};

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : null;
}

function Card({ action }: { action: KanbanAction }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none rounded-md border bg-card px-3 py-2 text-sm shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="font-mono text-muted-foreground text-xs">{action.reference}</p>
      <p className="mt-0.5 font-medium">{action.description_courte}</p>
      <div className="mt-1.5 flex items-center justify-between text-muted-foreground text-xs">
        <span>{ACTION_PRIORITE_LABELS[action.priorite]}</span>
        {formatDate(action.date_prevue) ? (
          <span className="rounded bg-muted px-1.5 py-0.5">
            échéance {formatDate(action.date_prevue)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Column({ statut, actions }: { statut: Statut; actions: KanbanAction[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: statut });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <p className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {ACTION_STATUT_LABELS[statut]} <span className="text-foreground">{actions.length}</span>
      </p>
      <div
        ref={setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "bg-surface"
        }`}
      >
        {actions.map((a) => (
          <Card key={a.id} action={a} />
        ))}
      </div>
    </div>
  );
}

export function ActionsKanban({ initial }: { initial: KanbanAction[] }) {
  const [items, setItems] = useState(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ACTION_STATUTS.map((statut) => (
          <Column key={statut} statut={statut} actions={items.filter((a) => a.statut === statut)} />
        ))}
      </div>
    </DndContext>
  );
}
