"use client";

import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DocumentPaper, type Societe } from "@/components/document-paper";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { SignatureCapture } from "@/components/signature-capture";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/types";
import type { Json } from "@/lib/supabase/database.types";
import { versionLettre } from "@/lib/versions";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");

/**
 * Document maîtrisé (politique, procédure…) : workflow de validation commun
 * (statut, version, soumission, approbation/signature, publication) et édition
 * DIRECTEMENT sur le gabarit officiel (logo + charte du client visibles en
 * rédigeant). Les actions serveur sont fournies par la page appelante, ce qui
 * permet de partager exactement la même logique entre tous les documents.
 */
export function MaitriseDocument({
  surtitre,
  titre,
  societe,
  metaExtra,
  initialContenu,
  statut,
  currentVersion,
  currentVersionDate,
  publishedCount,
  canWrite,
  canApprove,
  drafterName,
  drafterSignature,
  drafterSignedAt,
  approverName,
  approverSignature,
  approvedAt,
  printHref,
  labelDocument,
  signatureTitle,
  signatureDescription,
  beforeContent,
  structuredEditor,
  numberContentHeadingsFrom,
  onSaveContenu,
  onTransition,
  onPublish,
}: {
  surtitre: string;
  titre: string;
  societe: Societe;
  /** Métadonnées spécifiques au document (ex. Processus, Réf. ISO). */
  metaExtra?: { label: string; value: string; href?: string }[];
  initialContenu: JSONContent | null;
  statut: string;
  currentVersion: string | null;
  currentVersionDate: string | null;
  publishedCount: number;
  canWrite: boolean;
  canApprove: boolean;
  drafterName: string | null;
  drafterSignature?: string | null;
  drafterSignedAt?: string | null;
  approverName: string | null;
  approverSignature?: string | null;
  approvedAt: string | null;
  printHref: string;
  /** Nom du document pour les messages (« politique », « procédure »). */
  labelDocument: string;
  signatureTitle: string;
  signatureDescription: string;
  /** Rubriques structurées rendues dans le document (lecture), avant le contenu riche. */
  beforeContent?: React.ReactNode;
  /** Éditeur des rubriques structurées, affiché en mode édition (bascule « Modifier »). */
  structuredEditor?: React.ReactNode;
  /** Numérote automatiquement les titres (h1) du contenu à partir de ce numéro. */
  numberContentHeadingsFrom?: number;
  onSaveContenu: (contenu: Json) => Promise<ActionResult>;
  onTransition: (target: string) => Promise<ActionResult>;
  onPublish: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const contenuRef = useRef<JSONContent | null>(initialContenu);
  const dirtyRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  // Documents structurés (procédures) : édition via bascule « Modifier ».
  // Documents libres (politique) : édition directe en brouillon, sans bascule.
  const usesToggle = Boolean(structuredEditor);
  const editable = statut === "brouillon" && canWrite && (!usesToggle || editing);
  const isPublished = statut === "publiee";
  const nextVersion = versionLettre(publishedCount);

  const documentMeta = [
    { label: "Statut", value: STATUT_LABELS[statut] ?? statut },
    {
      label: "Version",
      value: isPublished && currentVersion ? currentVersion : `${nextVersion} (projet)`,
    },
    ...(approverName
      ? [
          { label: "Approuvé le", value: fmt(approvedAt ?? currentVersionDate) },
          { label: "Signataire", value: approverName },
        ]
      : []),
    ...(drafterName ? [{ label: "Rédacteur", value: drafterName }] : []),
    ...(metaExtra ?? []),
  ];

  function handleChange(c: JSONContent) {
    contenuRef.current = c;
    dirtyRef.current = true;
    setSaved(false);
  }

  async function persist(): Promise<boolean> {
    const result = await onSaveContenu((contenuRef.current ?? {}) as Json);
    if (result.ok) {
      dirtyRef.current = false;
      setSaved(true);
      return true;
    }
    toast.error(result.error);
    return false;
  }

  // Sauvegarde automatique tant qu'on est en brouillon.
  useEffect(() => {
    if (!editable) return;
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      const result = await onSaveContenu((contenuRef.current ?? {}) as Json);
      if (result.ok) {
        dirtyRef.current = false;
        setSaved(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [editable, onSaveContenu]);

  async function save() {
    setPending(true);
    if (await persist()) toast.success(`${cap(labelDocument)} enregistrée.`);
    setPending(false);
  }

  async function publish() {
    setPending(true);
    const result = await onPublish();
    setPending(false);
    if (result.ok) {
      toast.success(`${cap(labelDocument)} publiée. Version figée créée.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function transition(target: string, message: string) {
    setPending(true);
    if (editable && dirtyRef.current && !(await persist())) {
      setPending(false);
      return;
    }
    const result = await onTransition(target);
    setPending(false);
    if (result.ok) {
      toast.success(message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Statut</span>
          <Badge variant="secondary">{STATUT_LABELS[statut] ?? statut}</Badge>
          {isPublished && currentVersion ? (
            <span className="text-muted-foreground text-sm">
              · {currentVersion}
              {currentVersionDate ? ` · publiée le ${fmt(currentVersionDate)}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">
              · version en cours {nextVersion} (non publiée)
              {currentVersion
                ? ` · dernière publiée : ${currentVersion}${
                    currentVersionDate ? ` le ${fmt(currentVersionDate)}` : ""
                  }`
                : ""}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <DownloadPdfButton printHref={printHref} />
          {usesToggle && statut === "brouillon" && canWrite && !editing ? (
            <Button onClick={() => setEditing(true)}>Modifier</Button>
          ) : null}
          {usesToggle && editing ? (
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                await persist();
                setPending(false);
                setEditing(false);
                router.refresh();
              }}
            >
              Terminer
            </Button>
          ) : null}

          {editable ? (
            <>
              {saved ? (
                <span className="self-center text-muted-foreground text-xs">Enregistré ✓</span>
              ) : null}
              <Button onClick={save} disabled={pending} variant="outline">
                Enregistrer
              </Button>
            </>
          ) : null}

          {!editing && statut === "brouillon" && canWrite ? (
            <SignatureCapture
              triggerLabel="Soumettre à approbation"
              title={`Soumettre ${labelDocument} à approbation`}
              description="Signez avec votre mot de passe pour soumettre ce document à approbation."
              onSigned={() => transition("en_revue", "Soumise à approbation.")}
            />
          ) : null}
          {statut === "en_revue" && canApprove ? (
            <>
              <Button
                variant="outline"
                onClick={() => transition("brouillon", "Renvoyée en brouillon.")}
                disabled={pending}
              >
                Demander des modifications
              </Button>
              <SignatureCapture
                triggerLabel="Approuver et signer"
                title={signatureTitle}
                description={signatureDescription}
                onSigned={() =>
                  transition("approuvee", `${cap(labelDocument)} approuvée et signée.`)
                }
              />
            </>
          ) : null}
          {statut === "approuvee" && canApprove ? (
            <Button onClick={publish} disabled={pending}>
              Publier
            </Button>
          ) : null}
          {statut === "publiee" && canWrite ? (
            <Button
              variant="outline"
              onClick={() => transition("brouillon", "Nouvelle version en brouillon.")}
              disabled={pending}
            >
              Créer une nouvelle version
            </Button>
          ) : null}
        </div>
      </div>

      {statut === "brouillon" ? (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
          Étape : <span className="font-medium text-foreground">rédaction</span>. Complétez le
          document, puis « Soumettre à approbation » (rédacteur : manager ou dirigeant).
        </div>
      ) : null}
      {statut === "en_revue" ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">
            En attente d'approbation par le dirigeant.
          </span>{" "}
          <span className="text-muted-foreground">
            {canApprove
              ? "Vérifiez le document puis « Approuver et signer »."
              : "Seul le dirigeant peut approuver et signer."}
          </span>
        </div>
      ) : null}
      {statut === "approuvee" ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">Approuvée, non encore publiée.</span>{" "}
          <span className="text-muted-foreground">
            Cette version deviendra officiellement {nextVersion} une fois
            {canApprove ? " que vous aurez cliqué « Publier »." : " publiée par un approbateur."}
            {currentVersion ? ` En attendant, la version en vigueur reste ${currentVersion}.` : ""}
          </span>
        </div>
      ) : null}

      {/* Mode édition (documents structurés) : éditeur des rubriques au-dessus du gabarit. */}
      {usesToggle && editing ? <div className="mb-6">{structuredEditor}</div> : null}

      {/* Édition et lecture sur le même gabarit officiel (logo + charte client). */}
      <DocumentPaper
        surtitre={surtitre}
        titre={titre}
        societe={societe}
        meta={documentMeta}
        className="border"
      >
        {editing ? null : beforeContent}
        <div
          className={numberContentHeadingsFrom ? "doc-chapitres" : undefined}
          style={
            numberContentHeadingsFrom
              ? ({ counterReset: `chap ${numberContentHeadingsFrom - 1}` } as React.CSSProperties)
              : undefined
          }
        >
          <TiptapEditor
            key={statut}
            content={initialContenu}
            editable={editable}
            onChange={handleChange}
            bare={!editable}
          />
        </div>
        {!editing && (drafterName || approverName) ? (
          <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-md border text-sm">
            <Signataire
              label="Rédigé par"
              nom={drafterName}
              image={drafterSignature ?? null}
              date={drafterSignedAt ?? null}
              signe={Boolean(drafterSignedAt)}
            />
            <Signataire
              label="Approuvé par"
              nom={approverName}
              image={approverSignature ?? null}
              date={approvedAt ?? null}
              signe={Boolean(approverName)}
              border
            />
          </div>
        ) : null}
      </DocumentPaper>

      {!editable && !usesToggle ? (
        <p className="text-muted-foreground text-xs">
          Modifiable uniquement en statut « Brouillon ». Utilisez « Télécharger PDF » pour exporter.
        </p>
      ) : null}
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Cellule de signature (rédacteur / approbateur) avec image et horodatage. */
function Signataire({
  label,
  nom,
  image,
  date,
  signe,
  border,
}: {
  label: string;
  nom: string | null;
  image: string | null;
  date: string | null;
  signe: boolean;
  border?: boolean;
}) {
  return (
    <div className={border ? "border-l" : ""}>
      <div
        className="px-3 py-1.5 font-semibold"
        style={{ backgroundColor: "var(--charte)", color: "var(--charte-contrast)" }}
      >
        {label}
      </div>
      <div className="flex min-h-24 flex-col px-3 py-2">
        <p className="font-medium">{nom?.trim() ? nom : "-"}</p>
        {signe && image ? (
          // biome-ignore lint/performance/noImgElement: signature (data URL), document imprimable
          <img src={image} alt="Signature" className="mt-1 h-12 w-auto object-contain" />
        ) : null}
        {signe ? (
          <p className="mt-auto text-xs italic" style={{ color: "var(--charte)" }}>
            Signé électroniquement{date ? ` le ${fmt(date)}` : ""}
          </p>
        ) : label === "Approuvé par" ? (
          <p className="mt-auto text-[#0b1120]/40 text-xs">En attente d'approbation</p>
        ) : null}
      </div>
    </div>
  );
}
