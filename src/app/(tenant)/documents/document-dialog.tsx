"use client";

import { Pencil } from "lucide-react";
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
  createDocumentMaitriseAction,
  removeDocumentFichierAction,
  updateDocumentMaitriseAction,
  uploadDocumentFichierAction,
} from "@/lib/actions/documents-maitrise";
import { DOC_MAITRISE_TYPE_LABELS } from "@/lib/documents";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type DocumentRow = {
  id: string;
  code: string | null;
  titre: string;
  type: string;
  version: string | null;
  statut: string;
  redacteur: string | null;
  approbateur: string | null;
  date_approbation: string | null;
  date_revision_prevue: string | null;
  processus_id: string | null;
  emplacement: string | null;
  commentaire: string | null;
  fichier_nom: string | null;
};

export function DocumentDialog({
  document,
  processus,
}: {
  document?: DocumentRow;
  processus: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const isEdit = Boolean(document);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fichierNom, setFichierNom] = useState(document?.fichier_nom ?? null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const data = {
      code: f.get("code") || undefined,
      titre: f.get("titre"),
      type: f.get("type"),
      version: f.get("version") || undefined,
      statut: f.get("statut"),
      redacteur: f.get("redacteur") || undefined,
      approbateur: f.get("approbateur") || undefined,
      dateApprobation: f.get("dateApprobation") || undefined,
      dateRevisionPrevue: f.get("dateRevisionPrevue") || undefined,
      processusId: f.get("processusId") || undefined,
      emplacement: f.get("emplacement") || undefined,
      commentaire: f.get("commentaire") || undefined,
    };
    let docId: string | undefined;
    if (isEdit && document) {
      const result = await updateDocumentMaitriseAction({ id: document.id, ...data });
      if (!result.ok) {
        setPending(false);
        toast.error(result.error);
        return;
      }
      docId = document.id;
    } else {
      const result = await createDocumentMaitriseAction(data);
      if (!result.ok) {
        setPending(false);
        toast.error(result.error);
        return;
      }
      docId = result.id;
    }

    // Téléversement éventuel du fichier.
    if (file && docId) {
      const fd = new FormData();
      fd.set("id", docId);
      fd.set("file", file as Blob);
      const up = await uploadDocumentFichierAction(fd);
      if (!up.ok) {
        setPending(false);
        toast.error(`Document enregistré, mais fichier non envoyé : ${up.error}`);
        setOpen(false);
        router.refresh();
        return;
      }
    }

    setPending(false);
    toast.success(isEdit ? "Document mis à jour." : "Document ajouté.");
    setOpen(false);
    router.refresh();
  }

  async function handleRemoveFile() {
    if (!document?.id) return;
    const r = await removeDocumentFichierAction(document.id);
    if (r.ok) {
      setFichierNom(null);
      toast.success("Fichier supprimé.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon" aria-label="Modifier">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button>Ajouter un document</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le document" : "Nouveau document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                defaultValue={document?.code ?? ""}
                placeholder="PR-04"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" name="titre" required defaultValue={document?.titre ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={document?.type ?? "document_externe"}
              >
                {Object.entries(DOC_MAITRISE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
                defaultValue={document?.statut ?? "en_vigueur"}
              >
                <option value="brouillon">Brouillon</option>
                <option value="en_vigueur">En vigueur</option>
                <option value="archive">Archivé</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                name="version"
                defaultValue={document?.version ?? ""}
                placeholder="V1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                defaultValue={document?.processus_id ?? ""}
              >
                <option value="">—</option>
                {processus.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="redacteur">Rédacteur</Label>
              <Input id="redacteur" name="redacteur" defaultValue={document?.redacteur ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="approbateur">Approbateur</Label>
              <Input
                id="approbateur"
                name="approbateur"
                defaultValue={document?.approbateur ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateApprobation">Date d'approbation</Label>
              <Input
                id="dateApprobation"
                name="dateApprobation"
                type="date"
                defaultValue={document?.date_approbation ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateRevisionPrevue">Révision prévue</Label>
              <Input
                id="dateRevisionPrevue"
                name="dateRevisionPrevue"
                type="date"
                defaultValue={document?.date_revision_prevue ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="emplacement">Emplacement</Label>
            <Input
              id="emplacement"
              name="emplacement"
              defaultValue={document?.emplacement ?? ""}
              placeholder="Lien SharePoint, chemin réseau…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              defaultValue={document?.commentaire ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Fichier (PDF, Word… max 10 Mo)</Label>
            {fichierNom && !file ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{fichierNom}</span>
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
            {fichierNom && !file ? (
              <p className="text-muted-foreground text-xs">
                Choisir un fichier remplacera le fichier actuel.
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
