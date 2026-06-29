"use client";

import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DocumentPaper, type Societe } from "@/components/document-paper";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { SignatairesBlock } from "@/components/signataires";
import { SignatureCapture } from "@/components/signature-capture";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/types";
import { TIMEZONE } from "@/lib/format";
import type { Json } from "@/lib/supabase/database.types";
import { versionLettre } from "@/lib/versions";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  en_approbation: "En approbation",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { timeZone: TIMEZONE }) : "-";

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
  reference,
  onSaveReference,
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
  withVerification,
  canVerify,
  verifierName,
  verifierSignature,
  verifierSignedAt,
  approverName,
  approverSignature,
  approvedAt,
  printHref,
  labelDocument,
  signatureTitle,
  signatureDescription,
  beforeContent,
  hideSignataireMeta = false,
  structuredEditor,
  numberContentHeadingsFrom,
  onSaveContenu,
  onTransition,
  onPublish,
}: {
  surtitre: string;
  titre: string;
  societe: Societe;
  /**
   * Code documentaire (ex. « DG_SMQ_004 »). Si la prop est fournie (même null),
   * une ligne « Référence » est affichée en tête de l'en-tête du document.
   */
  reference?: string | null;
  /** Si fourni (et droits d'écriture), permet d'éditer la référence en ligne. */
  onSaveReference?: (code: string) => Promise<ActionResult>;
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
  /**
   * Circuit à 3 rôles : insère une étape de VÉRIFICATION entre la soumission
   * (rédacteur) et l'approbation. L'approbateur doit être différent du rédacteur
   * et du vérificateur (garanti côté server action).
   */
  withVerification?: boolean;
  canVerify?: boolean;
  verifierName?: string | null;
  verifierSignature?: string | null;
  verifierSignedAt?: string | null;
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
  /** Masque date d'approbation / signataire / rédacteur du bloc méta (doublon quand un tableau de révision les affiche déjà). */
  hideSignataireMeta?: boolean;
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

  // Libellé de statut : avec vérification, « en revue » = « en vérification ».
  const statutLabel = (s: string) =>
    withVerification && s === "en_revue" ? "En vérification" : (STATUT_LABELS[s] ?? s);

  // Les signatures/approbations ne reflètent QUE le cycle en cours : un brouillon
  // (nouvelle version) ne doit jamais afficher l'approbation de la version
  // précédente. Chaque rôle n'apparaît qu'une fois son étape franchie (et nommé).
  const showDrafter = statut !== "brouillon" && Boolean(drafterName) && Boolean(drafterSignedAt);
  const showVerifier =
    Boolean(withVerification) &&
    (statut === "en_approbation" || statut === "approuvee" || isPublished) &&
    Boolean(verifierName) &&
    Boolean(verifierSignedAt);
  const showApprover = (statut === "approuvee" || isPublished) && Boolean(approverName);
  // La grille de signature apparaît dès la soumission, avec les étapes
  // suivantes « en attente » tant qu'elles ne sont pas franchies.
  const showSignatures = statut !== "brouillon";

  const documentMeta = [
    // « Référence » en tête (l'en-tête du gabarit n'affiche que les 3 premières).
    ...(reference !== undefined ? [{ label: "Référence", value: reference?.trim() || "-" }] : []),
    { label: "Statut", value: statutLabel(statut) },
    {
      label: "Version",
      value: isPublished && currentVersion ? currentVersion : `${nextVersion} (projet)`,
    },
    // Quand un tableau de révision est affiché (procédures), il porte déjà la
    // date et les signataires de chaque version : on évite le doublon ici.
    ...(showApprover && !hideSignataireMeta
      ? [
          { label: "Approuvé le", value: fmt(approvedAt ?? currentVersionDate) },
          { label: "Signataire", value: approverName as string },
        ]
      : []),
    ...(showDrafter && !hideSignataireMeta
      ? [{ label: "Rédacteur", value: drafterName as string }]
      : []),
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

  // Sauvegarde automatique tant qu'on est en brouillon. Les erreurs sont
  // remontées (une seule fois) au lieu d'être avalées silencieusement, et un
  // dernier enregistrement est tenté à la fermeture (changement de page).
  const errorSignaledRef = useRef(false);
  useEffect(() => {
    if (!editable) return;
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      const result = await onSaveContenu((contenuRef.current ?? {}) as Json);
      if (result.ok) {
        dirtyRef.current = false;
        errorSignaledRef.current = false;
        setSaved(true);
      } else if (!errorSignaledRef.current) {
        errorSignaledRef.current = true;
        toast.error(`Enregistrement automatique impossible : ${result.error}`);
      }
    }, 2000);
    return () => {
      clearInterval(interval);
      // Flush des dernières modifications avant de quitter la vue.
      if (dirtyRef.current) void onSaveContenu((contenuRef.current ?? {}) as Json);
    };
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
          <Badge variant="secondary">{statutLabel(statut)}</Badge>
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
              triggerLabel={
                withVerification ? "Soumettre à vérification" : "Soumettre à approbation"
              }
              title={`Soumettre ${labelDocument} à ${withVerification ? "vérification" : "approbation"}`}
              description="Signez avec votre mot de passe pour soumettre ce document."
              onSigned={() => transition("en_revue", "Soumise pour la suite du circuit.")}
            />
          ) : null}

          {/* Étape de vérification (circuit à 3 rôles). */}
          {withVerification && statut === "en_revue" && canVerify ? (
            <>
              <Button
                variant="outline"
                onClick={() => transition("brouillon", "Renvoyée en brouillon.")}
                disabled={pending}
              >
                Demander des modifications
              </Button>
              <SignatureCapture
                triggerLabel="Vérifier et signer"
                title={`Vérifier ${labelDocument}`}
                description="Signez avec votre mot de passe pour attester la vérification du document."
                onSigned={() => transition("en_approbation", `${cap(labelDocument)} vérifiée.`)}
              />
            </>
          ) : null}

          {/* Étape d'approbation : en_approbation (avec vérif) ou en_revue (sans). */}
          {((withVerification && statut === "en_approbation") ||
            (!withVerification && statut === "en_revue")) &&
          canApprove ? (
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
          document, puis «{" "}
          {withVerification ? "Soumettre à vérification" : "Soumettre à approbation"} » (rédacteur :
          manager ou dirigeant).
        </div>
      ) : null}
      {statut === "en_revue" && withVerification ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">En attente de vérification.</span>{" "}
          <span className="text-muted-foreground">
            {canVerify
              ? "Vérifiez le document puis « Vérifier et signer » (manager ou dirigeant)."
              : "Un vérificateur (manager ou dirigeant) doit attester la vérification."}
          </span>
        </div>
      ) : null}
      {statut === "en_revue" && !withVerification ? (
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
      {statut === "en_approbation" ? (
        <div className="rounded-lg border border-status-pa/40 bg-status-pa/10 px-3 py-2 text-sm">
          <span className="font-medium text-status-pa">
            Vérifiée, en attente d'approbation par le dirigeant.
          </span>{" "}
          <span className="text-muted-foreground">
            {canApprove
              ? "Approuvez et signez (vous devez être différent du rédacteur et du vérificateur)."
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

      {/* Code documentaire éditable (ex. DG_SMQ_004), réservé aux rédacteurs. */}
      {onSaveReference && canWrite ? (
        <ReferenceEditor initial={reference ?? null} onSave={onSaveReference} />
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
        {!editing && showSignatures ? (
          <SignatairesBlock
            className="mt-8"
            cells={[
              {
                label: "Rédigé par",
                nom: showDrafter ? drafterName : null,
                image: showDrafter ? (drafterSignature ?? null) : null,
                date: showDrafter ? (drafterSignedAt ?? null) : null,
                signe: showDrafter,
              },
              ...(withVerification
                ? [
                    {
                      label: "Vérifié par",
                      nom: showVerifier ? (verifierName ?? null) : null,
                      image: showVerifier ? (verifierSignature ?? null) : null,
                      date: showVerifier ? (verifierSignedAt ?? null) : null,
                      signe: showVerifier,
                    },
                  ]
                : []),
              {
                label: "Approuvé par",
                nom: showApprover ? approverName : null,
                image: showApprover ? (approverSignature ?? null) : null,
                date: showApprover ? (approvedAt ?? null) : null,
                signe: showApprover,
              },
            ]}
          />
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

/** Saisie en ligne du code documentaire (enregistrement à la perte de focus). */
function ReferenceEditor({
  initial,
  onSave,
}: {
  initial: string | null;
  onSave: (code: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  async function commit() {
    const v = value.trim();
    if (v === (initial ?? "")) return;
    setSaving(true);
    const result = await onSave(v);
    setSaving(false);
    if (result.ok) {
      toast.success("Référence enregistrée.");
      router.refresh();
    } else {
      toast.error(result.error);
      setValue(initial ?? "");
    }
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <label htmlFor="doc-reference" className="font-medium text-muted-foreground text-sm">
        Référence du document
      </label>
      <Input
        id="doc-reference"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="ex. DG_SMQ_004"
        disabled={saving}
        className="h-8 w-44"
      />
    </div>
  );
}
