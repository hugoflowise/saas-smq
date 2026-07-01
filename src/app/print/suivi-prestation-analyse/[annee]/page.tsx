import { PrintShell, type Societe } from "@/components/print-shell";
import { SatisfactionBars } from "@/components/satisfaction-bars";
import { formatDate, todayISO } from "@/lib/format";
import {
  analyserSuivisPrestation,
  type Comptage,
  type SuiviPrestationRow,
} from "@/lib/suivi-prestation-analyse";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

/** Petit bloc « chiffre + libellé » pour la synthèse imprimée. */
function Chiffre({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="font-semibold text-2xl">{valeur}</p>
      <p className="mt-0.5 text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

/** Liste de décomptes (points forts, besoins…) pour l'impression. */
function ListeComptage({ items }: { items: Comptage[] }) {
  if (items.length === 0) return <p className="text-muted-foreground text-sm">Aucune donnée.</p>;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.slice(0, 10).map((c) => (
        <li key={c.label} className="flex justify-between gap-3">
          <span>{c.label}</span>
          <span className="shrink-0 font-medium tabular-nums text-muted-foreground">{c.count}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b pb-1 font-semibold text-sm uppercase tracking-wide">{titre}</h2>
      {children}
    </section>
  );
}

export default async function AnalyseSuiviPrestationPrintPage({
  params,
}: {
  params: Promise<{ annee: string }>;
}) {
  const { annee } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return <p className="p-8 text-sm">Aucun client sélectionné.</p>;
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const [{ data: tenant }, { data }] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte",
      )
      .eq("id", tid)
      .maybeSingle(),
    supabase
      .from("suivis_prestation")
      .select(
        "consultant, client, mission, date_suivi, satisfaction_globale, nps, est_reclamation, reponses",
      )
      .eq("tenant_id", tid)
      .order("date_suivi", { ascending: false, nullsFirst: false }),
  ]);

  const tous = (data ?? []) as SuiviPrestationRow[];
  const anneeNum = annee === "toutes" ? null : Number(annee);
  const rows =
    anneeNum == null || !Number.isFinite(anneeNum)
      ? tous
      : tous.filter((r) => Number((r.date_suivi ?? "").slice(0, 4)) === anneeNum);
  const a = analyserSuivisPrestation(rows);
  const periodeLabel = anneeNum == null || !Number.isFinite(anneeNum) ? "Toutes années" : annee;

  const meta = [
    { label: "Période", value: periodeLabel },
    { label: "Suivis analysés", value: String(a.nbSuivis) },
    { label: "Clients suivis", value: String(a.nbClients) },
    { label: "Généré le", value: formatDate(todayISO()) },
  ];

  return (
    <PrintShell
      backHref="/suivi-prestation/analyse"
      surtitre="Suivi de prestation"
      titre="Analyse de l'écoute client"
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <div className="flex flex-col gap-6">
        {a.nbSuivis === 0 ? (
          <p className="text-sm">Aucun suivi de prestation sur la période.</p>
        ) : (
          <>
            <Section titre="Synthèse">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Chiffre
                  valeur={a.satPct != null ? `${a.satPct}%` : "-"}
                  label="Clients satisfaits (note 4-5)"
                />
                <Chiffre
                  valeur={a.satMoyenne != null ? `${a.satMoyenne}/5` : "-"}
                  label="Satisfaction moyenne"
                />
                <Chiffre
                  valeur={a.nps != null ? String(a.nps) : "-"}
                  label={`NPS (${a.npsLabel})`}
                />
                <Chiffre
                  valeur={a.conformiteQsse != null ? `${a.conformiteQsse}%` : "-"}
                  label="Conformité QSSE"
                />
                <Chiffre valeur={String(a.nbSuivis)} label="Suivis réalisés" />
                <Chiffre valeur={String(a.nbClients)} label="Clients suivis" />
                <Chiffre valeur={String(a.nbConsultants)} label="Consultants suivis" />
                <Chiffre valeur={String(a.nbBesoinsDetectes)} label="Besoins détectés" />
              </div>
            </Section>

            <Section titre="Recommandation (NPS)">
              <p className="mb-2 text-sm">
                <span className="font-medium">{a.npsRepartition.promoteurs}</span> promoteurs (
                {a.npsRepartition.pctPromoteurs}%),{" "}
                <span className="font-medium">{a.npsRepartition.passifs}</span> passifs (
                {a.npsRepartition.pctPassifs}%),{" "}
                <span className="font-medium">{a.npsRepartition.detracteurs}</span> détracteurs (
                {a.npsRepartition.pctDetracteurs}%).
              </p>
              {a.npsRepartition.total > 0 ? (
                <div className="flex h-3 overflow-hidden rounded-full border">
                  <div
                    className="h-full bg-status-conforme"
                    style={{ width: `${a.npsRepartition.pctPromoteurs}%` }}
                  />
                  <div
                    className="h-full bg-muted-foreground/40"
                    style={{ width: `${a.npsRepartition.pctPassifs}%` }}
                  />
                  <div
                    className="h-full bg-status-nc-mineure"
                    style={{ width: `${a.npsRepartition.pctDetracteurs}%` }}
                  />
                </div>
              ) : null}
            </Section>

            <Section titre="Satisfaction par item">
              <SatisfactionBars items={a.axes.map((axe) => ({ label: axe.label, pct: axe.pct }))} />
            </Section>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Section titre="Points forts">
                <ListeComptage items={a.pointsForts} />
              </Section>
              <Section titre="Axes d'amélioration">
                <ListeComptage items={a.axesAmelioration} />
              </Section>
            </div>

            <Section titre="Besoins de développement détectés">
              <ListeComptage items={a.besoins} />
            </Section>

            <Section titre={`Points de vigilance (${a.vigilance.length})`}>
              {a.vigilance.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune réclamation ni note basse sur la période.
                </p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground text-xs">
                      <th className="py-1 pr-3 font-medium">Client</th>
                      <th className="py-1 pr-3 font-medium">Consultant</th>
                      <th className="py-1 pr-3 font-medium">Motif</th>
                      <th className="py-1 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.vigilance.map((v, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: liste figée pour impression
                      <tr key={`${v.client}-${i}`} className="border-b align-top">
                        <td className="py-1 pr-3 font-medium">{v.client}</td>
                        <td className="py-1 pr-3">{v.consultant}</td>
                        <td className="py-1 pr-3">{v.motif}</td>
                        <td className="py-1">{formatDate(v.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {a.verbatims.length > 0 ? (
              <Section titre="Verbatims clients">
                <div className="flex flex-col gap-2">
                  {a.verbatims.slice(0, 15).map((v, i) => (
                    <blockquote
                      // biome-ignore lint/suspicious/noArrayIndexKey: liste figée pour impression
                      key={`${v.client}-${i}`}
                      className="border-muted-foreground/30 border-l-2 pl-3 text-sm"
                    >
                      <p className="italic">« {v.texte} »</p>
                      <footer className="text-muted-foreground text-xs">
                        {v.client} · {v.origine}
                        {v.date ? ` · ${formatDate(v.date)}` : ""}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </Section>
            ) : null}
          </>
        )}
      </div>
    </PrintShell>
  );
}
