"use client";

import { SlidersHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createFamilleAction, deleteFamilleAction } from "@/lib/actions/duerp";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export function FamillesDialog({ familles }: { familles: { id: string; libelle: string }[] }) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [pending, startTransition] = useTransition();

  if (readOnly) return null;

  function add() {
    const val = libelle.trim();
    if (val.length < 2) return;
    startTransition(async () => {
      const r = await createFamilleAction({ libelle: val });
      if (r.ok) {
        setLibelle("");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteFamilleAction(id);
      if (r.ok) router.refresh();
      else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="size-4" />
            Familles de risques
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Familles de risques (DUERP)</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Liste pré-remplie (nomenclature type INRS), à adapter à votre activité.
        </p>
        <div className="flex gap-2">
          <Input
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            placeholder="Ajouter une famille…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button onClick={add} disabled={pending || libelle.trim().length < 2}>
            Ajouter
          </Button>
        </div>
        <ul className="flex flex-col divide-y rounded-xl border">
          {familles.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>{f.libelle}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Supprimer ${f.libelle}`}
                className="size-8 text-muted-foreground hover:text-destructive"
                disabled={pending}
                onClick={() => remove(f.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
