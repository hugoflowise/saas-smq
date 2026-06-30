"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { genererCycleAction } from "@/lib/actions/cycle-certification";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

/**
 * Génère le cycle de certification type sur 3 ans à partir de la date de l'audit
 * de certification. Les jalons créés sont proposés et restent éditables.
 */
export function GenererCycleDialog() {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  if (readOnly) return null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => genererCycleAction({ dateCertification: f.get("dateCertification") }),
      success: "Cycle de certification généré.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        Générer le cycle 3 ans
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Générer le cycle de certification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            À partir de la date de l'audit de certification, on crée les jalons types : audit blanc
            (−2 mois), certification, surveillances N+1 et N+2, renouvellement (N+3). Ils restent
            modifiables et supprimables.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dateCertification">Date de l'audit de certification</Label>
            <Input id="dateCertification" name="dateCertification" type="date" required />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Génération…" : "Générer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
