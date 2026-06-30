import { headers } from "next/headers";
import { CopyField } from "@/components/copy-field";
import { EmptyState } from "@/components/empty-state";
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
import { formatDate } from "@/lib/format";
import { computeNps, npsLabel, trimestre } from "@/lib/nps";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { EnqueteDelete } from "./enquete-delete";
import { EnqueteDialog } from "./enquete-dialog";
import { ExportButton } from "./export-button";

function npsClass(nps: number | null) {
  if (nps == null) return "text-muted-foreground";
  if (nps >= 30) return "text-status-conforme";
  if (nps >= 0) return "text-status-pa";
  return "text-status-nc-mineure";
}

export default async function SatisfactionPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Satisfaction client" description="Enquêtes de satisfaction et NPS." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: enquetes }, { data: tenant }] = await Promise.all([
    supabase
      .from("enquetes_satisfaction")
      .select(
        "id, client, date_reponse, note_recommandation, note_satisfaction, commentaire, est_reclamation, source",
      )
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("date_reponse", { ascending: false }),
    supabase.from("tenants").select("survey_token").eq("id", ctx.effectiveTenantId).maybeSingle(),
  ]);

  // Lien public du questionnaire : à partager aux clients (e-mail, signature, QR).
  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const surveyUrl = `${proto}://${host}/enquete/${tenant?.survey_token ?? ""}`;

  const items = enquetes ?? [];
  const { nps } = computeNps(items.map((e) => e.note_recommandation));
  const notesSat = items.map((e) => e.note_satisfaction).filter((n): n is number => n != null);
  const moyenne =
    notesSat.length > 0
      ? Math.round((notesSat.reduce((a, b) => a + b, 0) / notesSat.length) * 10) / 10
      : null;
  const reclamations = items.filter((e) => e.est_reclamation).length;

  // NPS par trimestre
  const parTrimestre = new Map<string, (number | null)[]>();
  for (const e of items) {
    const t = trimestre(e.date_reponse);
    if (!parTrimestre.has(t)) parTrimestre.set(t, []);
    parTrimestre.get(t)?.push(e.note_recommandation);
  }
  const trimestres = [...parTrimestre.entries()]
    .map(([t, notes]) => ({ t, ...computeNps(notes) }))
    .sort((a, b) => b.t.localeCompare(a.t))
    .slice(0, 6);

  const tiles = [
    { label: `NPS global (${npsLabel(nps)})`, value: nps ?? "-", cls: npsClass(nps) },
    { label: "Note moyenne /10", value: moyenne ?? "-", cls: "text-foreground" },
    { label: "Réponses", value: items.length, cls: "text-foreground" },
    { label: "Réclamations", value: reclamations, cls: "text-status-nc-mineure" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Satisfaction client"
        description="Mesure de la perception client (NPS, notes, réclamations)."
        isoClause="ISO 9001 §9.1.2"
        help={
          <span className="flex flex-col gap-1.5">
            <span>
              Surveillez la perception des clients. L'enjeu n'est pas le % de satisfaits, mais
              d'agir sur les insatisfactions.
            </span>
            <span>
              <strong>Calcul du NPS (Net Promoter Score)</strong> : sur la question «
              recommanderiez-vous ? » (0 à 10), on classe chaque réponse en{" "}
              <strong>promoteur</strong> (9-10), <strong>neutre</strong> (7-8) ou{" "}
              <strong>détracteur</strong> (0-6). NPS = % de promoteurs − % de détracteurs. Il va de
              −100 à +100 (les neutres ne comptent pas). Repères : ≥ 0 correct, ≥ 30 bon, ≥ 70
              excellent. Ce n'est donc pas une moyenne : une seule note de 8 donne un NPS de 0.
            </span>
          </span>
        }
      >
        <ExportButton rows={items} />
        <EnqueteDialog />
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Lien public du questionnaire</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Partagez ce lien à vos clients (e-mail, signature, QR code…). Chaque réponse alimente
            automatiquement ce module, en temps réel · sans aucune licence.
          </p>
          <CopyField label="Lien public du questionnaire" value={surveyUrl} />
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune réponse"
          description="Ajoutez les réponses de vos suivis de projet ou enquêtes de satisfaction."
        />
      ) : (
        <>
          <StatTiles tiles={tiles} className="mb-6" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="text-base">NPS par trimestre</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {trimestres.map((q) => (
                  <div key={q.t} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{q.t}</span>
                    <span className="flex items-center gap-2">
                      <span className={`font-semibold ${npsClass(q.nps)}`}>{q.nps ?? "-"}</span>
                      <span className="text-muted-foreground text-xs">({q.count})</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reco. (0-10)</TableHead>
                    <TableHead>Satisf. /10</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <EnqueteDialog
                          enquete={e}
                          trigger={
                            <button type="button" className={ROW_NAME_BUTTON}>
                              {e.client ?? "-"}
                            </button>
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(e.date_reponse)}</TableCell>
                      <TableCell>{e.note_recommandation ?? "-"}</TableCell>
                      <TableCell>{e.note_satisfaction ?? "-"}</TableCell>
                      <TableCell>
                        {e.est_reclamation ? (
                          <span
                            className={`${BADGE_BASE} bg-status-nc-mineure/15 text-status-nc-mineure`}
                          >
                            Réclamation
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <EnqueteDelete id={e.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
