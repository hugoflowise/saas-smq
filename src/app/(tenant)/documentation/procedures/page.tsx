import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CreateProcedureDialog } from "./create-procedure-dialog";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuvee: "Approuvée",
  publiee: "Publiée",
  archivee: "Archivée",
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
    .order("ordre_affichage", { ascending: true });
  const processusName = new Map((processus ?? []).map((p) => [p.id, p.nom]));

  const { data: procedures } = await supabase
    .from("procedures")
    .select("id, titre, processus_id, reference_iso, statut")
    .eq("tenant_id", tid)
    .order("titre", { ascending: true });

  const items = procedures ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Processus</TableHead>
                <TableHead>§ ISO</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/documentation/procedures/${p.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {p.titre}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {p.processus_id ? (processusName.get(p.processus_id) ?? "—") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {p.reference_iso?.length ? p.reference_iso.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUT_LABELS[p.statut] ?? p.statut}</Badge>
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
