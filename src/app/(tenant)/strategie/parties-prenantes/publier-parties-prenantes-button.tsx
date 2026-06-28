"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { publishPartiesPrenantesVersionAction } from "@/lib/actions/parties-prenantes";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/** Fige l'état actuel de la cartographie des parties prenantes (version A, B, C…). */
export function PublierPartiesPrenantesButton() {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function publier() {
    setPending(true);
    const r = await publishPartiesPrenantesVersionAction();
    setPending(false);
    if (r.ok) {
      toast.success("Nouvelle version des parties prenantes publiée.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <History className="size-4" />
            Publier une version
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publier une nouvelle version ?</DialogTitle>
          <DialogDescription>
            Cela fige la cartographie des parties prenantes actuelle comme une version officielle
            (A, B, C…), datée. Ne le faites que si la cartographie est prête.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Annuler</Button>} />
          <Button onClick={publier} disabled={pending}>
            {pending ? "Publication…" : "Publier la version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
