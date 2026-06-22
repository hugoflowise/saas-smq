import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { RoStatutCell } from "./inline-cells";
import { RoDialog } from "./ro-dialog";

const TYPE_LABELS: Record<string, string> = { risque: "Risque", opportunite: "Opportunité" };

function criticiteClass(c: number) {
  if (c > 15) return "bg-status-nc-majeure/15 text-status-nc-majeure";
  if (c >= 9) return "bg-status-pa/15 text-status-pa";
  return "bg-status-conforme/15 text-status-conforme";
}
function cellBg(c: number) {
  if (c > 15) return "bg-status-nc-mineure/25";
  if (c >= 9) return "bg-status-pa/25";
  return "bg-status-conforme/20";
}

export default async function RisquesPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Risques & Opportunités"
          description="Registre R&O et matrice de criticité."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer ses risques."
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

  const { data: ros } = await supabase
    .from("risques_opportunites")
    .select(
      "id, intitule, type, processus_id, cause, consequence, gravite, probabilite, criticite, gravite_residuelle, probabilite_residuelle, criticite_residuelle, traitement_prevu, statut, date_revue",
    )
    .eq("tenant_id", tid)
    .order("criticite", { ascending: false });

  const items = ros ?? [];

  // Comptage par cellule (gravité × probabilité) pour la matrice (risques)
  const countByCell = new Map<string, number>();
  for (const r of items) {
    if (r.type !== "risque") continue;
    const k = `${r.gravite}-${r.probabilite}`;
    countByCell.set(k, (countByCell.get(k) ?? 0) + 1);
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Risques & Opportunités"
        description="Registre R&O et matrice de criticité."
        isoClause="ISO 9001 §6.1"
        help="Déterminez les risques et opportunités liés à vos enjeux et parties intéressées, planifiez des actions pour les traiter et évaluez leur efficacité."
      >
        <RoDialog processusOptions={processus ?? []} />
      </PageHeader>

      {/* Matrice gravité × probabilité (risques) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Matrice de criticité (risques)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex items-center">
              <span className="-rotate-90 whitespace-nowrap text-muted-foreground text-xs">
                Probabilité →
              </span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1">
                {[5, 4, 3, 2, 1].map((prob) =>
                  [1, 2, 3, 4, 5].map((grav) => {
                    const c = grav * prob;
                    const n = countByCell.get(`${grav}-${prob}`) ?? 0;
                    return (
                      <div
                        key={`${grav}-${prob}`}
                        className={`flex aspect-square flex-col items-center justify-center rounded ${cellBg(c)}`}
                      >
                        {n > 0 ? <span className="font-semibold text-sm">{n}</span> : null}
                        <span className="text-[10px] text-muted-foreground">{c}</span>
                      </div>
                    );
                  }),
                )}
              </div>
              <p className="mt-1 text-center text-muted-foreground text-xs">Gravité →</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun risque ni opportunité"
          description="Créez un risque ou une opportunité pour démarrer le registre."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intitulé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>G × P</TableHead>
                <TableHead>Criticité brute</TableHead>
                <TableHead>Résiduelle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/risques/${r.id}`} className="hover:text-primary hover:underline">
                      {r.intitule}
                    </Link>
                  </TableCell>
                  <TableCell>{TYPE_LABELS[r.type] ?? r.type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.gravite} × {r.probabilite}
                  </TableCell>
                  <TableCell>
                    <span className={`${BADGE_BASE} ${criticiteClass(r.criticite ?? 0)}`}>
                      {r.criticite}
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.criticite_residuelle != null ? (
                      <span className={`${BADGE_BASE} ${criticiteClass(r.criticite_residuelle)}`}>
                        {r.criticite_residuelle}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RoStatutCell id={r.id} value={r.statut} />
                  </TableCell>
                  <TableCell>
                    <RoDialog processusOptions={processus ?? []} ro={r} />
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
