"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmJustificatifUploadAction,
  createCompetencePersonneAction,
  createJustificatifUploadUrlAction,
  deleteCompetencePersonneAction,
  removeJustificatifAction,
  updateCompetencePersonneAction,
} from "@/lib/actions/competences";
import { COMPETENCE_STATUT_LABELS } from "@/lib/competences";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { createClient } from "@/lib/supabase/client";
import { SELECT_CLASS } from "@/lib/ui-classes";

const MAX_TAILLE = 10 * 1024 * 1024; // 10 Mo

export type AttributionRow = {
  id: string;
  consultant_id: string;
  competence_id: string;
  niveau_requis: string | null;
  niveau_acquis: string | null;
  statut: string;
  date_obtention: string | null;
  date_echeance: string | null;
  organisme: string | null;
  commentaire: string | null;
  justificatif_nom: string | null;
};

export function AttributionDialog({
  attribution,
  consultants,
  competences,
  defaultConsultantId,
  trigger,
}: {
  attribution?: AttributionRow;
  consultants: { id: string; nom: string }[];
  competences: { id: string; libelle: string }[];
  defaultConsultantId?: string;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const isEdit = Boolean(attribution);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [justificatifNom, setJustificatifNom] = useState(attribution?.justificatif_nom ?? null);
  const readOnly = useReadOnly();

  async function handleDelete() {
    if (!attribution) return;
    if (!confirm("Retirer cette compétence de la personne ? Elle sera mise à la corbeille."))
      return;
    setPending(true);
    const r = await deleteCompetencePersonneAction(attribution.id);
    setPending(false);
    if (r.ok) {
      toast.success("Compétence retirée.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (file && file.size > MAX_TAILLE) {
      toast.error("Fichier trop volumineux (max 10 Mo).");
      return;
    }
    setPending(true);
    try {
      await doSubmit(event.currentTarget);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setPending(false);
    }
  }

  async function doSubmit(formEl: HTMLFormElement) {
    const f = new FormData(formEl);
    const data = {
      consultantId: f.get("consultantId"),
      competenceId: f.get("competenceId"),
      niveauRequis: f.get("niveauRequis") || undefined,
      niveauAcquis: f.get("niveauAcquis") || undefined,
      statut: f.get("statut"),
      dateObtention: f.get("dateObtention") || undefined,
      dateEcheance: f.get("dateEcheance") || undefined,
      organisme: f.get("organisme") || undefined,
      commentaire: f.get("commentaire") || undefined,
    };
    let rowId: string | undefined;
    if (isEdit && attribution) {
      const result = await updateCompetencePersonneAction({ id: attribution.id, ...data });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      rowId = attribution.id;
    } else {
      const result = await createCompetencePersonneAction(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      rowId = result.id;
    }

    // Téléversement éventuel de la pièce justificative (direct vers Storage).
    if (file && rowId) {
      const prep = await createJustificatifUploadUrlAction(rowId, file.name, file.size);
      if (!prep.ok) {
        toast.error(`Enregistré, mais pièce non envoyée : ${prep.error}`);
        setOpen(false);
        router.refresh();
        return;
      }
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type || undefined });
      if (upErr) {
        toast.error(`Enregistré, mais pièce non envoyée : ${upErr.message}`);
        setOpen(false);
        router.refresh();
        return;
      }
      const conf = await confirmJustificatifUploadAction(rowId, prep.path, file.name);
      if (!conf.ok) {
        toast.error(`Pièce envoyée, mais non rattachée : ${conf.error}`);
        setOpen(false);
        router.refresh();
        return;
      }
    }

    toast.success(isEdit ? "Compétence mise à jour." : "Compétence attribuée.");
    setOpen(false);
    router.refresh();
  }

  async function handleRemoveFile() {
    if (!attribution?.id) return;
    const r = await removeJustificatifAction(attribution.id);
    if (r.ok) {
      setJustificatifNom(null);
      toast.success("Pièce justificative supprimée.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  if (readOnly) return isEdit ? (trigger ?? null) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            (trigger ?? (
              <Button variant="ghost" size="icon" aria-label="Modifier">
                <Pencil className="size-4" />
              </Button>
            ))
          ) : (
            <Button>Attribuer une compétence</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'attribution" : "Attribuer une compétence"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="consultantId">Personne</Label>
              <select
                id="consultantId"
                name="consultantId"
                required
                className={SELECT_CLASS}
                defaultValue={attribution?.consultant_id ?? defaultConsultantId ?? ""}
              >
                <option value="">-</option>
                {consultants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="competenceId">Compétence</Label>
              <select
                id="competenceId"
                name="competenceId"
                required
                className={SELECT_CLASS}
                defaultValue={attribution?.competence_id ?? ""}
              >
                <option value="">-</option>
                {competences.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                name="statut"
                className={SELECT_CLASS}
                defaultValue={attribution?.statut ?? "a_acquerir"}
              >
                {Object.entries(COMPETENCE_STATUT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="organisme">Organisme</Label>
              <Input
                id="organisme"
                name="organisme"
                defaultValue={attribution?.organisme ?? ""}
                placeholder="ex. AFNOR, CACES…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="niveauRequis">Niveau requis</Label>
              <Input
                id="niveauRequis"
                name="niveauRequis"
                defaultValue={attribution?.niveau_requis ?? ""}
                placeholder="ex. confirmé, N2…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="niveauAcquis">Niveau acquis</Label>
              <Input
                id="niveauAcquis"
                name="niveauAcquis"
                defaultValue={attribution?.niveau_acquis ?? ""}
                placeholder="ex. débutant, N1…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateObtention">Date d'obtention</Label>
              <Input
                id="dateObtention"
                name="dateObtention"
                type="date"
                defaultValue={attribution?.date_obtention ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateEcheance">Échéance de validité</Label>
              <Input
                id="dateEcheance"
                name="dateEcheance"
                type="date"
                defaultValue={attribution?.date_echeance ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              defaultValue={attribution?.commentaire ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Pièce justificative (attestation, diplôme… max 10 Mo)</Label>
            {justificatifNom && !file ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{justificatifNom}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="shrink-0 text-status-nc-mineure text-xs hover:underline"
                >
                  Supprimer
                </button>
              </div>
            ) : null}
            <Input
              id="file"
              name="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {justificatifNom && !file ? (
              <p className="text-muted-foreground text-xs">
                Choisir un fichier remplacera la pièce actuelle.
              </p>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Attribuer"}
            </Button>
            {isEdit && attribution ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={handleDelete}
                className="gap-1.5 text-muted-foreground text-sm hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Retirer
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
