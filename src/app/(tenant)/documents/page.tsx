import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import {
  DOC_MAITRISE_TYPE_LABELS,
  DOC_STATUT_CLASS,
  DOC_STATUT_LABELS,
  statutDocumentNatif,
} from "@/lib/documents";
import { formatDate, todayISO } from "@/lib/format";
import { DOCUMENTATION_TABS } from "@/lib/module-tabs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { DocumentDialog, type DocumentRow } from "./document-dialog";
import { DocumentsFilters } from "./documents-filters";
import { FichierLink } from "./fichier-link";

const REVISION_ALERTE_JOURS = 60;

type MatriceRow = {
  key: string;
  code: string | null;
  titre: string;
  typeToken: string;
  typeLabel: string;
  version: string | null;
  statut: string;
  approbateur: string | null;
  dateApprobation: string | null;
  revisionPrevue: string | null;
  processusNom: string | null;
  href: string | null;
  registre: DocumentRow | null;
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; statut?: string }>;
}) {
  const ctx = await getTenantContext();
  const { type: typeFiltre, statut: statutFiltre } = await searchParams;
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Documents"
          description="Matrice documentaire : liste maîtrisée de tous les documents qualité."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const today = todayISO();

  const [{ data: politique }, { data: procedures }, { data: registre }, { data: processus }] =
    await Promise.all([
      supabase
        .from("politique_qualite")
        .select("statut, version_actuelle_id, approved_by, approved_at")
        .eq("tenant_id", tid)
        .maybeSingle(),
      supabase
        .from("procedures")
        .select("id, titre, statut, version_actuelle_id, approved_by, approved_at, processus_id")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .order("titre"),
      supabase
        .from("documents_maitrise")
        .select(
          "id, code, titre, type, version, statut, redacteur, approbateur, date_approbation, date_revision_prevue, processus_id, emplacement, commentaire, fichier_nom",
        )
        .eq("tenant_id", tid)
        .order("code", { nullsFirst: false }),
      supabase.from("processus").select("id, nom").eq("tenant_id", tid),
    ]);

  const processusList = (processus ?? []).map((p) => ({ id: p.id, nom: p.nom }));
  const processusNom = new Map(processusList.map((p) => [p.id, p.nom]));

  // Versions courantes (politique + procédures) pour le n° de version.
  const versionIds = [
    politique?.version_actuelle_id,
    ...(procedures ?? []).map((p) => p.version_actuelle_id),
  ].filter(Boolean) as string[];
  const versionById = new Map<string, string>();
  if (versionIds.length) {
    const [{ data: pv }, { data: prv }] = await Promise.all([
      supabase.from("politique_qualite_versions").select("id, version").in("id", versionIds),
      supabase.from("procedures_versions").select("id, version").in("id", versionIds),
    ]);
    for (const v of [...(pv ?? []), ...(prv ?? [])]) versionById.set(v.id, v.version);
  }

  // Noms des approbateurs.
  const approverIds = [
    politique?.approved_by,
    ...(procedures ?? []).map((p) => p.approved_by),
  ].filter(Boolean) as string[];
  const nameById = new Map<string, string>();
  if (approverIds.length) {
    const { data: persons } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", approverIds);
    for (const p of persons ?? []) nameById.set(p.id, p.full_name ?? p.email);
  }

  const rows: MatriceRow[] = [];

  if (politique) {
    rows.push({
      key: "politique",
      code: "POL",
      titre: "Politique qualité",
      typeToken: "politique",
      typeLabel: "Politique",
      version: politique.version_actuelle_id
        ? (versionById.get(politique.version_actuelle_id) ?? null)
        : null,
      statut: statutDocumentNatif(politique.statut),
      approbateur: politique.approved_by ? (nameById.get(politique.approved_by) ?? null) : null,
      dateApprobation: politique.approved_at,
      revisionPrevue: null,
      processusNom: "Direction",
      href: "/strategie/politique",
      registre: null,
    });
  }

  for (const p of procedures ?? []) {
    rows.push({
      key: `proc-${p.id}`,
      code: null,
      titre: p.titre,
      typeToken: "procedure",
      typeLabel: "Procédure",
      version: p.version_actuelle_id ? (versionById.get(p.version_actuelle_id) ?? null) : null,
      statut: statutDocumentNatif(p.statut),
      approbateur: p.approved_by ? (nameById.get(p.approved_by) ?? null) : null,
      dateApprobation: p.approved_at,
      revisionPrevue: null,
      processusNom: p.processus_id ? (processusNom.get(p.processus_id) ?? null) : null,
      href: `/documentation/procedures/${p.id}`,
      registre: null,
    });
  }

  for (const d of registre ?? []) {
    rows.push({
      key: `reg-${d.id}`,
      code: d.code,
      titre: d.titre,
      typeToken: d.type,
      typeLabel: DOC_MAITRISE_TYPE_LABELS[d.type] ?? d.type,
      version: d.version,
      statut: d.statut,
      approbateur: d.approbateur,
      dateApprobation: d.date_approbation,
      revisionPrevue: d.date_revision_prevue,
      processusNom: d.processus_id ? (processusNom.get(d.processus_id) ?? null) : null,
      href: null,
      registre: d as DocumentRow,
    });
  }

  const enVigueur = rows.filter((r) => r.statut === "en_vigueur").length;
  const alerteDate = new Date(Date.now() + REVISION_ALERTE_JOURS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const aReviser = rows.filter((r) => r.revisionPrevue && r.revisionPrevue <= alerteDate).length;

  const tiles = [
    { label: "Documents", value: rows.length, cls: "text-foreground" },
    { label: "En vigueur", value: enVigueur, cls: "text-status-conforme" },
    { label: "À réviser (≤ 60 j)", value: aReviser, cls: "text-status-pa" },
  ];

  // Types présents (pour le filtre), dans l'ordre d'apparition.
  const typeOptions: { value: string; label: string }[] = [];
  for (const r of rows) {
    if (!typeOptions.some((t) => t.value === r.typeToken)) {
      typeOptions.push({ value: r.typeToken, label: r.typeLabel });
    }
  }

  const visibleRows = rows.filter(
    (r) =>
      (!typeFiltre || r.typeToken === typeFiltre) && (!statutFiltre || r.statut === statutFiltre),
  );

  return (
    <div className="w-full">
      <ModuleTabs tabs={DOCUMENTATION_TABS} />
      <PageHeader
        title="Documents"
        description="Matrice documentaire : liste maîtrisée de tous les documents du système qualité."
        isoClause="ISO 9001 §7.5"
        help="Tenez à jour la liste de vos informations documentées : codification, version en vigueur, statut, qui approuve, et date de révision prévue. La politique et les procédures rédigées dans l'application y figurent automatiquement ; ajoutez ici vos autres documents (manuel, instructions, enregistrements, documents externes)."
      >
        <div className="flex flex-wrap items-center gap-2">
          {rows.length > 0 ? (
            <DocumentsFilters
              types={typeOptions}
              type={typeFiltre ?? null}
              statut={statutFiltre ?? null}
            />
          ) : null}
          <DocumentDialog processus={processusList} />
        </div>
      </PageHeader>

      {rows.length > 0 ? <StatTiles tiles={tiles} className="mb-6" /> : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Aucun document"
          description="La politique et les procédures apparaîtront ici dès leur création. Ajoutez vos autres documents maîtrisés avec « Ajouter un document »."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Document</TableHead>
                <TableHead className="w-36">Type</TableHead>
                <TableHead className="w-20">Version</TableHead>
                <TableHead className="w-28">Statut</TableHead>
                <TableHead className="w-40">Approbateur</TableHead>
                <TableHead className="w-32">Révision prévue</TableHead>
                <TableHead className="w-40">Fichier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                    Aucun document ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              ) : null}
              {visibleRows.map((r) => {
                const enRetard = r.revisionPrevue && r.revisionPrevue < today;
                const bientot = r.revisionPrevue && !enRetard && r.revisionPrevue <= alerteDate;
                return (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium text-muted-foreground text-sm">
                      {r.code ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.href ? (
                        <Link href={r.href} className="hover:text-primary hover:underline">
                          {r.titre}
                        </Link>
                      ) : r.registre ? (
                        <DocumentDialog
                          document={r.registre}
                          processus={processusList}
                          trigger={
                            <button type="button" className={ROW_NAME_BUTTON}>
                              {r.titre}
                            </button>
                          }
                        />
                      ) : (
                        r.titre
                      )}
                      {r.processusNom ? (
                        <span className="block text-muted-foreground text-xs">
                          {r.processusNom}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.typeLabel}</TableCell>
                    <TableCell className="text-sm">{r.version ?? "-"}</TableCell>
                    <TableCell>
                      <span className={`${BADGE_BASE} ${DOC_STATUT_CLASS[r.statut] ?? "bg-muted"}`}>
                        {DOC_STATUT_LABELS[r.statut] ?? r.statut}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {r.approbateur ?? "-"}
                      {r.dateApprobation ? (
                        <span className="block text-xs">le {formatDate(r.dateApprobation)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.revisionPrevue ? (
                        <span
                          className={
                            enRetard
                              ? "font-medium text-status-nc-mineure"
                              : bientot
                                ? "font-medium text-status-pa"
                                : "text-muted-foreground"
                          }
                        >
                          {formatDate(r.revisionPrevue)}
                          {enRetard ? " · en retard" : bientot ? " · bientôt" : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.registre?.fichier_nom ? (
                        <FichierLink id={r.registre.id} nom={r.registre.fichier_nom} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
