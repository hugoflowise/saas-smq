"use client";

import { Check, ListTodo, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addTodoAction, deleteTodoAction, toggleTodoAction } from "@/lib/actions/todos";
import type { TodoPerso } from "@/lib/todos";

const POS_KEY = "todo-widget-pos";
const MIN_KEY = "todo-widget-min";
const WIDTH = 288; // largeur du panneau (px)

type Pos = { x: number; y: number };

/** Trie : tâches non cochées en premier (ordre d'origine), cochées en bas. */
function trier(items: TodoPerso[]): TodoPerso[] {
  return [...items].sort((a, b) => Number(a.done) - Number(b.done));
}

export function TodoWidget({ initialTodos }: { initialTodos: TodoPerso[] }) {
  const [todos, setTodos] = useState<TodoPerso[]>(() => trier(initialTodos));
  const [texte, setTexte] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [, startTransition] = useTransition();
  // Déplacement : on mémorise le décalage curseur↔élément + le point de départ
  // pour distinguer un vrai glissement d'un simple clic.
  const dragRef = useRef<{ dx: number; dy: number; sx: number; sy: number } | null>(null);
  const movedRef = useRef(false);
  const elRef = useRef<HTMLDivElement | HTMLButtonElement | null>(null);

  // Restaure position + état réduit (préférences UI locales au navigateur).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) setPos(JSON.parse(raw));
      setMinimized(localStorage.getItem(MIN_KEY) === "1");
    } catch {
      // ignore (localStorage indisponible)
    }
  }, []);

  // Position par défaut : coin bas-droit, si rien de mémorisé.
  useEffect(() => {
    if (pos === null && typeof window !== "undefined") {
      setPos({ x: window.innerWidth - WIDTH - 24, y: window.innerHeight - 420 });
    }
  }, [pos]);

  const savePos = useCallback((p: Pos) => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (!pos) return;
    dragRef.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      sx: e.clientX,
      sy: e.clientY,
    };
    movedRef.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    if (
      Math.abs(e.clientX - dragRef.current.sx) > 4 ||
      Math.abs(e.clientY - dragRef.current.sy) > 4
    ) {
      movedRef.current = true;
    }
    // Largeur réelle de l'élément (panneau ouvert ou pastille réduite) : permet
    // de coller la pastille tout à droite sans la limiter à la largeur ouverte.
    const w = elRef.current?.offsetWidth ?? WIDTH;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - 60;
    const x = Math.min(Math.max(8, e.clientX - dragRef.current.dx), Math.max(8, maxX));
    const y = Math.min(Math.max(8, e.clientY - dragRef.current.dy), Math.max(8, maxY));
    setPos({ x, y });
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current && pos && movedRef.current) savePos(pos);
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  function setMin(v: boolean) {
    setMinimized(v);
    try {
      localStorage.setItem(MIN_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function ajouter() {
    const t = texte.trim();
    if (!t) return;
    setTexte("");
    // Optimiste : ligne temporaire en attendant l'id réel.
    const tempId = `temp-${t}-${todos.length}`;
    setTodos((prev) => trier([...prev, { id: tempId, texte: t, done: false, done_at: null }]));
    startTransition(async () => {
      const r = await addTodoAction({ texte: t });
      if (r.ok) {
        setTodos((prev) => trier(prev.map((x) => (x.id === tempId ? { ...x, id: r.id } : x))));
      } else {
        setTodos((prev) => prev.filter((x) => x.id !== tempId));
        toast.error(r.error);
      }
    });
  }

  function basculer(todo: TodoPerso) {
    const done = !todo.done;
    setTodos((prev) =>
      trier(
        prev.map((x) =>
          x.id === todo.id ? { ...x, done, done_at: done ? new Date().toISOString() : null } : x,
        ),
      ),
    );
    startTransition(async () => {
      const r = await toggleTodoAction({ id: todo.id, done });
      if (!r.ok) toast.error(r.error);
    });
  }

  function supprimer(id: string) {
    setTodos((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => {
      const r = await deleteTodoAction({ id });
      if (!r.ok) toast.error(r.error);
    });
  }

  if (!pos) return null;

  const restantes = todos.filter((t) => !t.done).length;

  // Réduit : une simple pastille déplaçable avec le nombre de tâches restantes.
  if (minimized) {
    return (
      <button
        type="button"
        ref={(el) => {
          elRef.current = el;
        }}
        onClick={() => {
          if (!movedRef.current) setMin(false);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.x, top: pos.y }}
        className="fixed z-50 flex touch-none items-center gap-2 rounded-full border bg-primary px-4 py-2.5 text-primary-foreground shadow-lg print:hidden"
        aria-label="Ouvrir la ToDo"
      >
        <ListTodo className="size-4" />
        {restantes > 0 ? (
          <span className="font-semibold text-sm tabular-nums">{restantes}</span>
        ) : null}
      </button>
    );
  }

  return (
    <div
      ref={(el) => {
        elRef.current = el;
      }}
      style={{ left: pos.x, top: pos.y, width: WIDTH }}
      className="fixed z-50 flex max-h-[60vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl print:hidden"
    >
      {/* En-tête : déplacement (glisser) + réduction (clic simple). Le repli est
          déclenché au relâchement si l'utilisateur n'a pas glissé. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => {
          onPointerUp(e);
          if (!movedRef.current) setMin(true);
        }}
        className="flex cursor-grab touch-none items-center gap-2 border-b bg-muted/40 px-3 py-2 active:cursor-grabbing"
      >
        <span className="flex items-center gap-1.5 font-semibold text-sm">
          <ListTodo className="size-4" /> ToDo
        </span>
        <span className="ml-auto text-muted-foreground text-xs tabular-nums">{restantes}</span>
        <span className="rounded-md p-1 text-muted-foreground" aria-hidden="true">
          <Minus className="size-4" />
        </span>
      </div>

      {/* Saisie */}
      <div className="flex items-center gap-1.5 border-b px-2 py-2">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ajouter();
          }}
          placeholder="Ajouter une tâche…"
          className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!texte.trim()}
          className="rounded-md bg-primary p-1.5 text-primary-foreground disabled:opacity-40"
          aria-label="Ajouter"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Liste */}
      <ul className="flex-1 overflow-y-auto p-1.5">
        {todos.length === 0 ? (
          <li className="px-2 py-6 text-center text-muted-foreground text-sm">
            Rien pour l'instant.
          </li>
        ) : (
          todos.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/50"
            >
              <button
                type="button"
                onClick={() => basculer(t)}
                className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                  t.done ? "border-primary bg-primary text-primary-foreground" : "border-input"
                }`}
                aria-label={t.done ? "Décocher" : "Cocher"}
              >
                {t.done ? <Check className="size-3" /> : null}
              </button>
              <span
                className={`min-w-0 flex-1 break-words text-sm ${
                  t.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {t.texte}
              </span>
              <button
                type="button"
                onClick={() => supprimer(t.id)}
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
