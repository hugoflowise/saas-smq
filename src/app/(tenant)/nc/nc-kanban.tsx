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
import { setNcStatutAction } from "@/lib/actions/nc";
import { NC_GRAVITE_LABELS, NC_STATUT_LABELS, NC_STATUTS } from "@/lib/labels";

type Statut = (typeof NC_STATUTS)[number];

export type KanbanNc = {
  id: string;
  reference: string;
  intitule: string;
  gravite: keyof typeof NC_GRAVITE_LABELS;
  statut: Statut;
};

function Card({ nc }: { nc: KanbanNc }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: nc.id });
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
      <p className="font-mono text-muted-foreground text-xs">{nc.reference}</p>
      <p className="mt-0.5 font-medium">{nc.intitule}</p>
      <p className="mt-1 text-muted-foreground text-xs">{NC_GRAVITE_LABELS[nc.gravite]}</p>
    </div>
  );
}

function Column({ statut, ncs }: { statut: Statut; ncs: KanbanNc[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: statut });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <p className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {NC_STATUT_LABELS[statut]} <span className="text-foreground">{ncs.length}</span>
      </p>
      <div
        ref={setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "bg-surface"
        }`}
      >
        {ncs.map((nc) => (
          <Card key={nc.id} nc={nc} />
        ))}
      </div>
    </div>
  );
}

export function NcKanban({ initial }: { initial: KanbanNc[] }) {
  const [items, setItems] = useState(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const target = event.over?.id ? (String(event.over.id) as Statut) : null;
    if (!target) return;

    const current = items.find((n) => n.id === id);
    if (!current || current.statut === target) return;

    const previous = items;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, statut: target } : n)));

    const result = await setNcStatutAction({ id, statut: target });
    if (!result.ok) {
      setItems(previous);
      toast.error(result.error);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {NC_STATUTS.map((statut) => (
          <Column key={statut} statut={statut} ncs={items.filter((n) => n.statut === statut)} />
        ))}
      </div>
    </DndContext>
  );
}
