"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  confirmDocumentUploadAction,
  createDocumentMaitriseAction,
  createDocumentUploadUrlAction,
  deleteDocumentMaitriseAction,
  previewDocumentCodeAction,
  removeDocumentFichierAction,
  updateDocumentMaitriseAction,
} from "@/lib/actions/documents-maitrise";
import { DOC_MAITRISE_TYPE_LABELS } from "@/lib/documents";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { createClient } from "@/lib/supabase/client";
import { SELECT_CLASS } from "@/lib/ui-classes";

const MAX_TAILLE = 10 * 1024 * 1024; // 10 Mo

export type DocumentRow = {
  id: string;
  code: string | null;
  titre: string;
  type: string;
  version: string | null;
  duree_conservation: string | null;
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
  trigger,
}: {
  document?: DocumentRow;
  processus: { id: string; nom: string }[];
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const isEdit = Boolean(document);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fichierNom, setFichierNom] = useState(document?.fichier_nom ?? null);
  const readOnly = useReadOnly();

  // Aperçu du prochain code disponible (création uniquement). On suit le code
  // saisi, le type et le processus pour interroger le serveur quand le champ
  // Code est laissé vide. Le code calculé reste indicatif : c'est le serveur
  // qui génère réellement à l'insertion si le champ est vide.
  const [code, setCode] = useState(document?.code ?? "");
  const [type, setType] = useState(document?.type ?? "document_externe");
  const [processusId, setProcessusId] = useState(document?.processus_id ?? "");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [previewPending, startPreview] = useTransition();

  useEffect(() => {
    // Aperçu pertinent seulement à la création, hors lecture seule, champ vide,
    // type + processus renseignés.
    if (isEdit || readOnly || code.trim() || !type || !processusId) {
      setPreviewCode(null);
      return;
    }
    startPreview(async () => {
      const r = await previewDocumentCodeAction({ type, processusId });
      setPreviewCode(r.ok ? r.code : null);
    });
  }, [isEdit, readOnly, code, type, processusId]);

  async function handleDelete() {
    if (!document) return;
    // §7.5 - Garde-fou : un enregistrement en vigueur est une preuve à conserver.
    // On avertit explicitement (confirmation renforcée) avant la mise en corbeille.
    const estPreuve = document.type === "enregistrement" && document.statut === "en_vigueur";
    const message = estPreuve
      ? `⚠️ « ${document.titre} » est un ENREGISTREMENT en vigueur : c'est une preuve à conserver (ISO 9001 §7.5). Il sera mis à la corbeille (restaurable depuis la page Corbeille), mais ne supprimez un enregistrement que si vous êtes certain qu'il ne constitue pas une preuve d'audit. Confirmer la mise en corbeille ?`
      : `Supprimer le document « ${document.titre} » ? Il sera mis à la corbeille.`;
    if (!confirm(message)) {
      return;
    }
    setPending(true);
    const r = await deleteDocumentMaitriseAction(document.id);
    setPending(false);
    if (r.ok) {
      toast.success("Document supprimé.");
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
      code: f.get("code") || undefined,
      titre: f.get("titre"),
      type: f.get("type"),
      version: f.get("version") || undefined,
      statut: f.get("statut"),
      redacteur: f.get("redacteur") || undefined,
      approbateur: f.get("approbateur") || undefined,
      dateApprobation: f.get("dateApprobation") || undefined,
      dateRevisionPrevue: f.get("dateRevisionPrevue") || undefined,
      dureeConservation: f.get("dureeConservation") || undefined,
      processusId: f.get("processusId") || undefined,
      emplacement: f.get("emplacement") || undefined,
      commentaire: f.get("commentaire") || undefined,
    };
    let docId: string | undefined;
    if (isEdit && document) {
      const result = await updateDocumentMaitriseAction({ id: document.id, ...data });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      docId = document.id;
    } else {
      const result = await createDocumentMaitriseAction(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      docId = result.id;
    }

    // Téléversement éventuel du fichier, directement vers Storage (URL signée).
    if (file && docId) {
      const prep = await createDocumentUploadUrlAction(docId, file.name, file.size);
      if (!prep.ok) {
        toast.error(`Document enregistré, mais fichier non envoyé : ${prep.error}`);
        setOpen(false);
        router.refresh();
        return;
      }
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type || undefined });
      if (upErr) {
        toast.error(`Document enregistré, mais fichier non envoyé : ${upErr.message}`);
        setOpen(false);
        router.refresh();
        return;
      }
      const conf = await confirmDocumentUploadAction(docId, prep.path, file.name, file.size);
      if (!conf.ok) {
        toast.error(`Fichier envoyé, mais non rattaché : ${conf.error}`);
        setOpen(false);
        router.refresh();
        return;
      }
    }

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
            <Button>Ajouter un document</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le document" : "Nouveau document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={isEdit ? "" : (previewCode ?? "Auto")}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" name="titre" required defaultValue={document?.titre ?? ""} />
            </div>
          </div>
          {!isEdit ? (
            <p className="-mt-2 text-muted-foreground text-xs">
              {!code.trim() && previewCode ? (
                <>
                  Prochain code disponible :{" "}
                  <span className="font-mono text-foreground">{previewCode}</span>. Laissez le champ
                  vide pour l'attribuer automatiquement.
                </>
              ) : !code.trim() && previewPending ? (
                "Calcul du prochain code…"
              ) : (
                <>
                  Laissez le code vide pour une génération automatique{" "}
                  <span className="font-mono">FAMILLE_PROCESSUS_001</span> (selon le type et le
                  processus choisis).
                </>
              )}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {Object.entries(DOC_MAITRISE_TYPE_LABELS)
                  // « Procédure » se rédige dans son module natif (Documentation →
                  // Procédures) et apparaît automatiquement dans la liste : on ne
                  // le propose donc pas à la création d'un document de registre
                  // (qui attend un fichier). On le conserve en édition pour ne pas
                  // casser une éventuelle ligne existante de ce type.
                  .filter(([value]) => isEdit || value !== "procedure")
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
              {!isEdit ? (
                <p className="text-muted-foreground text-xs">
                  Les procédures et la politique se rédigent dans leur module et apparaissent ici
                  automatiquement.
                </p>
              ) : null}
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
                defaultValue={document?.version ?? "A"}
                placeholder="A"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="processusId">Processus</Label>
              <select
                id="processusId"
                name="processusId"
                className={SELECT_CLASS}
                value={processusId}
                onChange={(e) => setProcessusId(e.target.value)}
              >
                <option value="">-</option>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="dureeConservation">Durée de stockage</Label>
              <Input
                id="dureeConservation"
                name="dureeConservation"
                defaultValue={document?.duree_conservation ?? ""}
                placeholder="ex. 3 ans, 5 ans, illimitée"
              />
            </div>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="emplacement">Lien externe / référence (optionnel)</Label>
            <Input
              id="emplacement"
              name="emplacement"
              defaultValue={document?.emplacement ?? ""}
              placeholder="Lien SharePoint, chemin réseau… (si le document n'est pas hébergé ici)"
            />
            <p className="text-muted-foreground text-xs">
              À renseigner uniquement pour les documents conservés ailleurs (non téléversés
              ci-dessus).
            </p>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
            {isEdit && document ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={handleDelete}
                className="gap-1.5 text-muted-foreground text-sm hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Supprimer le document
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
