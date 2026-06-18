import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
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
import { VeilleDialog } from "./veille-dialog";

const DOMAINE_LABELS: Record<string, string> = {
  travail: "Travail",
  qualite: "Qualité",
  environnement: "Environnement",
  securite: "Sécurité",
  rgpd: "RGPD",
  autre: "Autre",
};
const STATUT_LABELS: Record<string, string> = {
  a_analyser: "À analyser",
  analysee: "Analysée",
  integree: "Intégrée",
  sans_objet: "Sans objet",
};

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function VeillePage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Veille réglementaire"
          description="Textes applicables et analyse d'impact."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: textes } = await supabase
    .from("veille_reglementaire")
    .select(
      "id, reference, intitule, domaine, date_publication, date_application, impact_smq, actions_a_prevoir, statut",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_application", { ascending: false, nullsFirst: false });

  const items = textes ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Veille réglementaire"
        description="Textes applicables et analyse d'impact."
      >
        <VeilleDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun texte"
          description="Ajoutez les textes réglementaires applicables et leur impact sur le SMQ."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intitulé</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.intitule}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {t.reference ?? "—"}
                  </TableCell>
                  <TableCell>{DOMAINE_LABELS[t.domaine] ?? t.domaine}</TableCell>
                  <TableCell>{formatDate(t.date_application)}</TableCell>
                  <TableCell>{STATUT_LABELS[t.statut] ?? t.statut}</TableCell>
                  <TableCell>
                    <VeilleDialog veille={t} />
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
