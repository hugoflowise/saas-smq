import { ExternalLink } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { CopyField } from "@/app/(tenant)/parametres/copy-field";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QrCode } from "@/components/qr-code";
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
import { computeNps, npsLabel } from "@/lib/nps";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ExportButton } from "./export-button";

const QSSE_KEYS = ["securite_consignes", "securite_epi", "plan_prevention"];

export default async function SuiviPrestationPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Suivi de prestation" description="Comptes rendus de visite client." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: suivis } = await supabase
    .from("suivis_prestation")
    .select(
      "id, consultant, client, mission, manager, date_suivi, satisfaction_globale, nps, est_reclamation, nouvelle_date_suivi, reponses",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("date_suivi", { ascending: false, nullsFirst: false });

  const items = suivis ?? [];

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("survey_token")
    .eq("id", ctx.effectiveTenantId)
    .maybeSingle();
  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const lien = `${proto}://${host}/enquete/${tenant?.survey_token ?? ""}/prestation-client`;

  // KPIs
  const notes = items.map((s) => s.satisfaction_globale).filter((n): n is number => n != null);
  const satMoyenne =
    notes.length > 0
      ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
      : null;
  const { nps } = computeNps(items.map((s) => s.nps));
  const reclamations = items.filter((s) => s.est_reclamation).length;
  let oui = 0;
  let nonSo = 0;
  for (const s of items) {
    const r = (s.reponses ?? {}) as Record<string, unknown>;
    for (const k of QSSE_KEYS) {
      if (r[k] === "Oui") oui++;
      else if (r[k] === "Non") nonSo++;
    }
  }
  const conformiteQsse = oui + nonSo > 0 ? Math.round((oui / (oui + nonSo)) * 100) : null;

  const tiles = [
    { label: "Suivis réalisés", value: items.length, cls: "text-foreground" },
    { label: "Satisfaction moy. /5", value: satMoyenne ?? "—", cls: "text-status-conforme" },
    { label: `NPS (${npsLabel(nps)})`, value: nps ?? "—", cls: "text-status-pf" },
    {
      label: "Conformité QSSE",
      value: conformiteQsse != null ? `${conformiteQsse}%` : "—",
      cls: "text-status-pa",
    },
    { label: "Réclamations", value: reclamations, cls: "text-status-nc-mineure" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Suivi de prestation client"
        description="Comptes rendus de visite client, remplis par les Business Managers."
        isoClause="ISO 9001 §9.1.2 / §8"
        help="Lien à partager aux BM (mail, signature, QR code) : ils remplissent le compte rendu sur le terrain, sans connexion. Les réponses alimentent la satisfaction et les réclamations. NPS = % promoteurs (9-10) − % détracteurs (0-6), les notes 7-8 étant neutres (une note de 8 donne donc un NPS de 0)."
      >
        <ExportButton
          rows={items.map((s) => ({
            est_reclamation: s.est_reclamation,
            reponses: (s.reponses ?? null) as Record<string, unknown> | null,
          }))}
        />
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Partager le formulaire</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <QrCode value={lien} />
          <div className="min-w-0 flex-1">
            <CopyField label="Lien à partager aux BM" value={lien} />
            <a
              href={lien}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-medium text-sm transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              Ouvrir le formulaire
            </a>
            <p className="mt-2 text-muted-foreground text-xs">
              Aucune connexion requise : le BM ouvre le lien (ou scanne le QR) sur son téléphone et
              remplit le compte rendu.
            </p>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <Card key={t.label}>
              <CardContent className="py-5">
                <p className={`font-semibold text-3xl ${t.cls}`}>{t.value}</p>
                <p className="mt-1 text-muted-foreground text-xs">{t.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun suivi"
          description="Partagez le lien aux BM : les comptes rendus apparaîtront ici."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Consultant</TableHead>
                <TableHead>Satisf. /5</TableHead>
                <TableHead>NPS</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Prochain suivi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/suivi-prestation/${s.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {formatDate(s.date_suivi)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/suivi-prestation/${s.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {s.client ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{s.consultant ?? "—"}</TableCell>
                  <TableCell>{s.satisfaction_globale ?? "—"}</TableCell>
                  <TableCell>{s.nps ?? "—"}</TableCell>
                  <TableCell>
                    {s.est_reclamation ? (
                      <span
                        className={`${BADGE_BASE} bg-status-nc-mineure/15 text-status-nc-mineure`}
                      >
                        À traiter
                      </span>
                    ) : (
                      <span className={`${BADGE_BASE} bg-status-conforme/15 text-status-conforme`}>
                        OK
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(s.nouvelle_date_suivi)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
