import type { JSONContent } from "@tiptap/react";
import { EngagementsCard } from "@/app/(tenant)/strategie/objectifs/engagements-card";
import { BackLink } from "@/components/back-link";
import type { Societe } from "@/components/document-paper";
import { EmptyState } from "@/components/empty-state";
import { MaitriseDocument } from "@/components/maitrise-document";
import { PageHeader } from "@/components/page-header";
import { SupprimerButton } from "@/components/supprimer-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  publishPolitiqueAction,
  resetPolitiqueAction,
  savePolitiqueCodeAction,
  savePolitiqueContenuAction,
  transitionPolitiqueStatutAction,
} from "@/lib/actions/politique";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionLettre } from "@/lib/versions";
import { VersionHistory } from "./version-history";

export default async function PolitiquePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const retourDocuments = from === "/documents";
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Politique qualité"
          description="Document maîtrisé définissant les engagements qualité de la direction."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer sa politique qualité."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte",
    )
    .eq("id", tid)
    .maybeSingle();

  const { data: politique } = await supabase
    .from("politique_qualite")
    .select(
      "code, contenu, statut, version_actuelle_id, created_by, soumis_par, soumis_le, verifie_par, verifie_le, approved_by, approved_at",
    )
    .eq("tenant_id", tid)
    .maybeSingle();

  const { data: rawVersions } = await supabase
    .from("politique_qualite_versions")
    .select(
      "id, version, approved_at, approved_by, redige_par, redige_le, verifie_par, verifie_le, contenu_snapshot, created_at",
    )
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });

  // Noms des intervenants (rédacteur = qui a soumis, vérificateur, approbateurs)
  const personIds = [
    ...new Set(
      [
        politique?.soumis_par,
        politique?.verifie_par,
        politique?.approved_by,
        ...(rawVersions ?? []).flatMap((v) => [v.approved_by, v.redige_par, v.verifie_par]),
      ].filter(Boolean),
    ),
  ] as string[];
  const { data: persons } = personIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, signature_image")
        .in("id", personIds)
    : { data: [] };
  const nameById = new Map((persons ?? []).map((p) => [p.id, p.full_name ?? p.email]));
  const signatureById = new Map((persons ?? []).map((p) => [p.id, p.signature_image]));

  const versions = (rawVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    approvedAt: v.approved_at,
    approverName: v.approved_by ? (nameById.get(v.approved_by) ?? null) : null,
    approverSignature: v.approved_by ? (signatureById.get(v.approved_by) ?? null) : null,
    redacteur: v.redige_par ? (nameById.get(v.redige_par) ?? null) : null,
    redacteurSignature: v.redige_par ? (signatureById.get(v.redige_par) ?? null) : null,
    redacteurSignedAt: v.redige_le ?? null,
    verificateur: v.verifie_par ? (nameById.get(v.verifie_par) ?? null) : null,
    verificateurSignature: v.verifie_par ? (signatureById.get(v.verifie_par) ?? null) : null,
    verificateurSignedAt: v.verifie_le ?? null,
    snapshot: (v.contenu_snapshot ?? null) as JSONContent | null,
  }));

  const current = versions.find((v) => v.id === politique?.version_actuelle_id) ?? null;

  // Engagements de la politique (§6.2) + matrice de couverture engagement → objectif → KPI.
  const [{ data: engagements }, { data: objectifsEng }, { data: liensEng }] = await Promise.all([
    supabase
      .from("politique_engagements")
      .select("id, libelle")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("ordre", { ascending: true }),
    supabase
      .from("objectifs_qualite")
      .select("id, intitule, engagement_id")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("objectif_indicateurs").select("objectif_id, indicateur_id").eq("tenant_id", tid),
  ]);
  const objsEng = objectifsEng ?? [];
  const indIds = [...new Set((liensEng ?? []).map((l) => l.indicateur_id))];
  const indNomById = new Map<string, string>();
  if (indIds.length) {
    const { data: inds } = await supabase
      .from("indicateurs")
      .select("id, nom")
      .in("id", indIds)
      .is("deleted_at", null);
    for (const i of inds ?? []) indNomById.set(i.id, i.nom);
  }
  const indsByObjectif = new Map<string, { id: string; nom: string }[]>();
  for (const l of liensEng ?? []) {
    const nom = indNomById.get(l.indicateur_id);
    if (!nom) continue;
    const list = indsByObjectif.get(l.objectif_id) ?? [];
    list.push({ id: l.indicateur_id, nom });
    indsByObjectif.set(l.objectif_id, list);
  }
  const engagementsCouverture = (engagements ?? []).map((e) => ({
    id: e.id,
    libelle: e.libelle,
    objectifs: objsEng
      .filter((o) => o.engagement_id === e.id)
      .map((o) => ({
        id: o.id,
        intitule: o.intitule,
        indicateurs: indsByObjectif.get(o.id) ?? [],
      })),
  }));
  const tousObjectifs = objsEng.map((o) => ({ id: o.id, intitule: o.intitule }));

  const isApprover = ctx.role === "admin_flowise" || ctx.role === "dirigeant";
  const canWrite = isApprover || ctx.role === "manager";
  // Rédacteur du document = la personne qui a soumis la version (signature de
  // soumission), pas le créateur initial de la ligne.
  const drafterName = politique?.soumis_par ? (nameById.get(politique.soumis_par) ?? null) : null;
  const verifierName = politique?.verifie_par
    ? (nameById.get(politique.verifie_par) ?? null)
    : null;
  const approverName = politique?.approved_by
    ? (nameById.get(politique.approved_by) ?? null)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {retourDocuments ? <BackLink href="/documents" label="Retour aux documents" /> : null}

      <PageHeader
        title="Politique qualité"
        description="Document maîtrisé définissant les engagements qualité de la direction."
        isoClause="ISO 9001 §5.2"
        help="La direction établit et tient à jour une politique qualité adaptée à la finalité de l'organisme. Elle sert de cadre aux objectifs qualité, est communiquée à tous et tenue à disposition des parties intéressées."
      >
        {politique && canWrite ? (
          <SupprimerButton
            action={resetPolitiqueAction}
            id="politique"
            label="Réinitialiser la politique"
            successText="Politique réinitialisée."
            confirmText="Réinitialiser la politique qualité ? Le contenu sera effacé et repassé en brouillon."
          />
        ) : null}
      </PageHeader>

      <div className="mb-6">
        <EngagementsCard engagements={engagementsCouverture} tousObjectifs={tousObjectifs} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <MaitriseDocument
            surtitre="Document maîtrisé"
            titre="Politique qualité"
            societe={tenant as Societe}
            reference={politique?.code ?? null}
            onSaveReference={savePolitiqueCodeAction}
            initialContenu={(politique?.contenu ?? null) as JSONContent | null}
            afterContent={
              engagementsCouverture.length > 0 ? (
                <div className="mt-8">
                  <h2 className="mb-2 font-semibold text-lg">Nos engagements qualité</h2>
                  <ol className="ml-5 list-decimal space-y-1">
                    {engagementsCouverture.map((e) => (
                      <li key={e.id}>{e.libelle}</li>
                    ))}
                  </ol>
                </div>
              ) : null
            }
            statut={politique?.statut ?? "brouillon"}
            currentVersion={current?.version ?? null}
            currentVersionDate={current?.approvedAt ?? null}
            publishedCount={versions.length}
            canWrite={canWrite}
            canApprove={isApprover}
            drafterName={drafterName}
            drafterSignature={
              politique?.soumis_par ? (signatureById.get(politique.soumis_par) ?? null) : null
            }
            drafterSignedAt={politique?.soumis_le ?? null}
            withVerification
            canVerify={canWrite}
            verifierName={verifierName}
            verifierSignature={
              politique?.verifie_par ? (signatureById.get(politique.verifie_par) ?? null) : null
            }
            verifierSignedAt={politique?.verifie_le ?? null}
            approverName={approverName}
            approverSignature={
              politique?.approved_by ? (signatureById.get(politique.approved_by) ?? null) : null
            }
            approvedAt={politique?.approved_at ?? null}
            printHref="/print/politique"
            labelDocument="politique"
            signatureTitle="Approuver la politique qualité"
            signatureDescription="Signez avec votre mot de passe pour approuver ce document."
            onSaveContenu={savePolitiqueContenuAction}
            onTransition={transitionPolitiqueStatutAction}
            onPublish={publishPolitiqueAction}
          />
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des versions</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <VersionHistory
                versions={versions}
                pending={
                  politique && politique.statut !== "publiee"
                    ? { version: versionLettre(versions.length), statut: politique.statut }
                    : null
                }
                document={{
                  surtitre: "Document maîtrisé",
                  titre: "Politique qualité",
                  societe: tenant as Societe,
                  reference: politique?.code ?? null,
                  withVerification: true,
                }}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
