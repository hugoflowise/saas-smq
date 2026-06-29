"use client";

import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { enregistrerEvaluationFournisseurAction } from "@/lib/actions/fournisseurs";
import { formatDate, todayISO } from "@/lib/format";
import { CRITERES_FOURNISSEUR, type NotesCriteres } from "@/lib/fournisseurs-criteres";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type EvaluationRow = {
  id: string;
  date_evaluation: string;
  note_globale: number | null;
  notes_criteres: NotesCriteres;
  commentaire: string | null;
};

/** Lit en sécurité une note de critère depuis le jsonb (clé → nombre). */
function noteCritere(notes: NotesCriteres, cle: string): number | null {
  const v = notes?.[cle];
  return typeof v === "number" ? v : null;
}

export function FournisseurEvaluationDialog({
  fournisseurId,
  fournisseurNom,
  evaluations,
}: {
  fournisseurId: string;
  fournisseurNom: string;
  evaluations: EvaluationRow[];
}) {
  const { open, setOpen, pending, submit } = useDialogForm();
  const readOnly = useReadOnly();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    submit(event, {
      action: (f) => {
        const notesCriteres: NotesCriteres = {};
        for (const c of CRITERES_FOURNISSEUR) {
          const raw = f.get(`critere_${c.cle}`);
          if (raw) notesCriteres[c.cle] = Number(raw);
        }
        return enregistrerEvaluationFournisseurAction({
          fournisseurId,
          dateEvaluation: f.get("dateEvaluation") || undefined,
          noteGlobale: f.get("noteGlobale"),
          notesCriteres,
          commentaire: f.get("commentaire") || undefined,
          prochaineEvaluation: f.get("prochaineEvaluation") || undefined,
        });
      },
      success: "Évaluation enregistrée.",
    });
  }

  // En lecture seule (auditeur) : pas de formulaire, mais on garde l'accès à
  // l'historique (preuve de surveillance §8.4.1).
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Évaluer / historique">
            <ClipboardCheck className="size-4" />
          </Button>
        }
      />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Évaluations - {fournisseurNom}</DialogTitle>
        </DialogHeader>

        {!readOnly ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateEvaluation">Date d'évaluation</Label>
                <Input
                  id="dateEvaluation"
                  name="dateEvaluation"
                  type="date"
                  required
                  defaultValue={todayISO()}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="prochaineEvaluation">Prochaine évaluation</Label>
                <Input id="prochaineEvaluation" name="prochaineEvaluation" type="date" />
              </div>
            </div>

            <fieldset className="flex flex-col gap-2 rounded-xl border p-3">
              <legend className="px-1 text-sm font-medium">Notes par critère (1 à 5)</legend>
              {CRITERES_FOURNISSEUR.map((c) => (
                <div key={c.cle} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`critere_${c.cle}`} className="font-normal">
                    {c.label}
                  </Label>
                  <select
                    id={`critere_${c.cle}`}
                    name={`critere_${c.cle}`}
                    className={`${SELECT_CLASS} w-20`}
                    defaultValue=""
                  >
                    <option value="">–</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="noteGlobale">Note globale (1 à 5)</Label>
              <Input id="noteGlobale" name="noteGlobale" type="number" min={1} max={5} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea id="commentaire" name="commentaire" rows={2} />
            </div>

            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? "Enregistrement…" : "Enregistrer l'évaluation"}
            </Button>
          </form>
        ) : null}

        <div className="mt-2">
          <h3 className="mb-2 text-sm font-medium">Historique des évaluations</h3>
          {evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune évaluation enregistrée.</p>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Globale</TableHead>
                    {CRITERES_FOURNISSEUR.map((c) => (
                      <TableHead key={c.cle} title={c.label}>
                        {c.label.split(" ")[0]}
                      </TableHead>
                    ))}
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{formatDate(e.date_evaluation)}</TableCell>
                      <TableCell>{e.note_globale != null ? `${e.note_globale}/5` : "-"}</TableCell>
                      {CRITERES_FOURNISSEUR.map((c) => {
                        const n = noteCritere(e.notes_criteres, c.cle);
                        return <TableCell key={c.cle}>{n != null ? n : "-"}</TableCell>;
                      })}
                      <TableCell className="text-muted-foreground">
                        {e.commentaire ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
