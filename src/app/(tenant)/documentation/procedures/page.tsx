import Link from "next/link";
import { DocumentDialog, type DocumentRow } from "@/app/(tenant)/documents/document-dialog";
import { EmptyState } from "@/components/empty-state";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { ProcessusLink } from "@/components/processus-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { DOC_STATUT_CLASS, DOC_STATUT_LABELS, statutDocumentNatif } from "@/lib/documents";
import { DOCUMENTATION_TABS } from "@/lib/module-tabs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { CreateProcedureDialog } from "./create-procedure-dialog";

// Une procédure de la liste : soit native (rédigée dans l'app), soit issue du
// registre (documents_maitrise typé « procédure »). Les deux sont listées ici
// pour que l'onglet reflète exactement la liste maîtresse.
type LigneProcedure = {
  key: string;
  code: string | null;
  titre: string;
  processusId: string | null;
  processusNom: string | null;
  isoRef: string;
  statut: string;
  href: string | null;
  registre: DocumentRow | null;
};

export default async function ProceduresPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Procédures" description="Documents maîtrisés et modes opératoires." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer ses procédures."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("ordre_affichage", { ascending: true });
  const processusName = new Map((processus ?? []).map((p) => [p.id, p.nom]));

  const [{ data: procedures }, { data: registre }] = await Promise.all([
    supabase
      .from("procedures")
      .select("id, code, titre, processus_id, reference_iso, statut")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("titre", { ascending: true }),
    // Procédures saisies dans le registre (liste maîtresse) : même type « procédure ».
    supabase
      .from("documents_maitrise")
      .select(
        "id, code, titre, type, version, statut, redacteur, approbateur, date_approbation, date_revision_prevue, processus_id, emplacement, commentaire, fichier_nom",
      )
      .eq("tenant_id", tid)
      .eq("type", "procedure"),
  ]);

  const natives: LigneProcedure[] = (procedures ?? []).map((p) => ({
    key: `proc-${p.id}`,
    code: p.code,
    titre: p.titre,
    processusId: p.processus_id,
    processusNom: p.processus_id ? (processusName.get(p.processus_id) ?? null) : null,
    isoRef: p.reference_iso?.length ? p.reference_iso.join(", ") : "-",
    statut: statutDocumentNatif(p.statut),
    href: `/documentation/procedures/${p.id}`,
    registre: null,
  }));
  const duRegistre: LigneProcedure[] = (registre ?? []).map((d) => ({
    key: `reg-${d.id}`,
    code: d.code,
    titre: d.titre,
    processusId: d.processus_id,
    processusNom: d.processus_id ? (processusName.get(d.processus_id) ?? null) : null,
    isoRef: "-",
    statut: d.statut,
    href: null,
    registre: d as DocumentRow,
  }));
  const items = [...natives, ...duRegistre].sort((a, b) => a.titre.localeCompare(b.titre, "fr"));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ModuleTabs tabs={DOCUMENTATION_TABS} />
      <PageHeader
        title="Procédures"
        description="Documents maîtrisés et modes opératoires."
        isoClause="ISO 9001 §7.5"
        help="Maîtrise des informations documentées : identification, version, approbation (rédacteur, vérificateur, approbateur) et accessibilité. Enregistrez chaque document à un emplacement unique pour éviter les versions désynchronisées."
      >
        <CreateProcedureDialog processusOptions={processus ?? []} />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune procédure"
          description="Créez votre première procédure pour démarrer la documentation."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Code</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Processus</TableHead>
                <TableHead>§ ISO</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.key}>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {p.code ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.href ? (
                      <Link href={p.href} className="hover:text-primary hover:underline">
                        {p.titre}
                      </Link>
                    ) : p.registre ? (
                      <DocumentDialog
                        document={p.registre}
                        processus={processus ?? []}
                        trigger={
                          <button type="button" className={ROW_NAME_BUTTON}>
                            {p.titre}
                          </button>
                        }
                      />
                    ) : (
                      p.titre
                    )}
                  </TableCell>
                  <TableCell>
                    <ProcessusLink id={p.processusId} nom={p.processusNom} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.isoRef}</TableCell>
                  <TableCell>
                    <span className={`${BADGE_BASE} ${DOC_STATUT_CLASS[p.statut] ?? "bg-muted"}`}>
                      {DOC_STATUT_LABELS[p.statut] ?? p.statut}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
