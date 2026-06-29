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
import { setNcStatutAction } from "@/lib/actions/nc";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { NC_GRAVITE_LABELS, NC_STATUT_LABELS, NC_STATUTS } from "@/lib/labels";
import { useNcStatutError } from "./nc-statut-error-dialog";

type Statut = (typeof NC_STATUTS)[number];

export type KanbanNc = {
  id: string;
  reference: string;
  intitule: string;
  gravite: keyof typeof NC_GRAVITE_LABELS;
  statut: Statut;
};

function Card({ nc, readOnly }: { nc: KanbanNc; readOnly: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: nc.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    // En lecture seule (auditeur) : pas de drag, carte statique.
    <div
      ref={readOnly ? undefined : setNodeRef}
      style={readOnly ? undefined : style}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
      className={`rounded-xl bg-card px-3.5 py-3 text-sm shadow-soft ring-1 ring-foreground/5 transition-shadow hover:ring-foreground/10 ${
        readOnly ? "" : "cursor-grab touch-none active:cursor-grabbing"
      } ${isDragging ? "opacity-60" : ""}`}
    >
      <p className="font-mono text-[11px] text-muted-foreground">{nc.reference}</p>
      <p className="mt-1.5 font-medium leading-snug">{nc.intitule}</p>
      <p className="mt-2 text-muted-foreground text-xs">{NC_GRAVITE_LABELS[nc.gravite]}</p>
    </div>
  );
}

function Column({ statut, ncs, readOnly }: { statut: Statut; ncs: KanbanNc[]; readOnly: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: statut });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1.5">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {NC_STATUT_LABELS[statut]}
        </span>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-muted-foreground text-xs">
          {ncs.length}
        </span>
      </div>
      <div
        ref={readOnly ? undefined : setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2.5 rounded-2xl p-2.5 transition-colors ${
          !readOnly && isOver ? "bg-primary/5 ring-1 ring-primary/30" : "bg-foreground/[0.025]"
        }`}
      >
        {ncs.map((nc) => (
          <Card key={nc.id} nc={nc} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}

export function NcKanban({ initial }: { initial: KanbanNc[] }) {
  const [items, setItems] = useState(initial);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const readOnly = useReadOnly();
  const { handleStatutError, dialog } = useNcStatutError();

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
      handleStatutError(result);
    }
  }

  // En lecture seule (auditeur) : pas de DndContext ni de handler, cartes visibles.
  if (readOnly) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {NC_STATUTS.map((statut) => (
          <Column
            key={statut}
            statut={statut}
            ncs={items.filter((n) => n.statut === statut)}
            readOnly
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {NC_STATUTS.map((statut) => (
            <Column
              key={statut}
              statut={statut}
              ncs={items.filter((n) => n.statut === statut)}
              readOnly={false}
            />
          ))}
        </div>
      </DndContext>
      {dialog}
    </>
  );
}
