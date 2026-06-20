import { EmptyState } from "@/components/empty-state";
import { KpiChart } from "@/components/kpi-chart";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
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
import { type Consultant, computeEffectif, nomComplet } from "@/lib/effectif";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ConsultantDelete } from "./consultant-delete";
import { ConsultantDialog } from "./consultant-dialog";

function pctClass(p: number | null) {
  if (p == null) return "text-muted-foreground";
  if (p >= 90) return "text-status-conforme";
  if (p >= 70) return "text-status-pa";
  return "text-status-nc-mineure";
}

function Mouvement({
  titre,
  liste,
  champDate,
}: {
  titre: string;
  liste: Consultant[];
  champDate: "date_demarrage" | "date_fin";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {titre} <span className="text-foreground">{liste.length}</span>
      </p>
      {liste.length === 0 ? (
        <p className="text-muted-foreground text-sm">—</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {liste.slice(0, 8).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">{nomComplet(c)}</span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {formatDate(c[champDate])}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function EffectifPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Effectif & couverture" description="Suivi de l'effectif consultant." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("consultants")
    .select(
      "id, reference, nom, prenom, entite, poste, date_demarrage, date_fin, odm, pdp, visite_medicale",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("nom", { ascending: true });

  const consultants = (data ?? []) as Consultant[];
  const today = todayISO();
  const { effectifActuel, couverture, trend, mouvements } = computeEffectif(consultants, today);

  const fmtPct = (v: number | null) => (v == null ? "—" : `${v}%`);
  const tiles = [
    { label: "Effectif actuel", value: effectifActuel ?? "—", cls: "text-foreground" },
    { label: "Couverture ODM", value: fmtPct(couverture.odm), cls: pctClass(couverture.odm) },
    { label: "Couverture PDP", value: fmtPct(couverture.pdp), cls: pctClass(couverture.pdp) },
    {
      label: "Couverture visites méd.",
      value: fmtPct(couverture.visite),
      cls: pctClass(couverture.visite),
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Effectif & couverture"
        description="Effectif consultant, couverture documentaire et mouvements."
        isoClause="ISO 9001 §7.1 / §9.1.1"
        help="Suivi de l'effectif et de la couverture (ordres de mission, plans de prévention, visites médicales) en % des consultants actifs. Saisie manuelle pour démarrer ; un import Boond pourra alimenter ce référentiel ensuite."
      >
        <ConsultantDialog />
      </PageHeader>

      {consultants.length === 0 ? (
        <EmptyState
          title="Aucun consultant"
          description="Ajoutez vos consultants (ou importez-les depuis Boond) pour suivre l'effectif et la couverture."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <StatTiles tiles={tiles} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendance de l'effectif (12 semaines)</CardTitle>
              </CardHeader>
              <CardContent>
                <KpiChart data={trend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mouvements</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Mouvement
                  titre="Entrées (période)"
                  liste={mouvements.entrees}
                  champDate="date_demarrage"
                />
                <Mouvement
                  titre="Sorties (période)"
                  liste={mouvements.sorties}
                  champDate="date_fin"
                />
                <Mouvement
                  titre="Futurs arrivants"
                  liste={mouvements.futursArrivants}
                  champDate="date_demarrage"
                />
                <Mouvement
                  titre="Futurs sortants"
                  liste={mouvements.futursSortants}
                  champDate="date_fin"
                />
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Démarrage</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>ODM</TableHead>
                  <TableHead>PDP</TableHead>
                  <TableHead>Visite méd.</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultants.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{nomComplet(c)}</TableCell>
                    <TableCell className="text-muted-foreground">{c.entite ?? "—"}</TableCell>
                    <TableCell>{formatDate(c.date_demarrage)}</TableCell>
                    <TableCell>{formatDate(c.date_fin)}</TableCell>
                    {[
                      { k: "odm", ok: c.odm },
                      { k: "pdp", ok: c.pdp },
                      { k: "visite", ok: c.visite_medicale },
                    ].map(({ k, ok }) => (
                      <TableCell key={k}>
                        <span
                          className={`${BADGE_BASE} ${
                            ok
                              ? "bg-status-conforme/15 text-status-conforme"
                              : "bg-status-nc-mineure/15 text-status-nc-mineure"
                          }`}
                        >
                          {ok ? "Oui" : "Non"}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center">
                        <ConsultantDialog consultant={c} />
                        <ConsultantDelete id={c.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
