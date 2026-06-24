import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { KpiChart } from "@/components/kpi-chart";
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
import { formatDate } from "@/lib/format";
import { cibleAffichee, FREQUENCE_LABELS } from "@/lib/indicateurs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { IndicateurDialog } from "../create-indicateur-dialog";
import { AddValeurForm } from "./add-valeur-form";

export default async function IndicateurDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from?.startsWith("/") ? from : "/indicateurs";
  const backLabel = from?.startsWith("/processus") ? "Retour au processus" : "Indicateurs";
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/indicateurs");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: ind } = await supabase
    .from("indicateurs")
    .select(
      "id, nom, description, processus_id, type, unite, formule_calcul, cible, sens, frequence_mesure",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!ind) notFound();

  const [{ data: valeurs }, { data: objectifs }, { data: processusOptions }] = await Promise.all([
    supabase
      .from("indicateurs_valeurs")
      .select("id, valeur, date_mesure, commentaire")
      .eq("indicateur_id", id)
      .order("date_mesure", { ascending: true }),
    supabase
      .from("objectifs_qualite")
      .select("id, intitule, statut")
      .eq("tenant_id", tid)
      .eq("indicateur_id", id)
      .is("deleted_at", null)
      .order("created_at"),
    supabase.from("processus").select("id, nom").eq("tenant_id", tid).order("ordre_affichage"),
  ]);

  const points = (valeurs ?? []).map((v) => ({
    date: formatDate(v.date_mesure),
    valeur: Number(v.valeur),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <PageHeader title={ind.nom} description={ind.description ?? undefined}>
        <IndicateurDialog indicateur={ind} processusOptions={processusOptions ?? []} />
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Caractéristiques</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Méthode / formule de calcul
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{ind.formule_calcul?.trim() || "-"}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Objectif / cible
            </p>
            <p className="mt-1 text-sm">{cibleAffichee(ind.cible, ind.sens, ind.unite)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Fréquence
            </p>
            <p className="mt-1 text-sm">
              {FREQUENCE_LABELS[ind.frequence_mesure] ?? ind.frequence_mesure}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Évolution {ind.unite ? `(${ind.unite})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <KpiChart data={points} cible={ind.cible} unite={ind.unite} />
        </CardContent>
      </Card>

      {(objectifs ?? []).length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Objectifs pilotés par cet indicateur</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <ul className="flex flex-col divide-y">
              {(objectifs ?? []).map((o) => (
                <li key={o.id} className="py-2.5">
                  <Link
                    href="/strategie/objectifs"
                    className="flex items-center justify-between gap-3 text-sm hover:text-primary"
                  >
                    <span className="min-w-0 truncate font-medium">{o.intitule}</span>
                    <span className="shrink-0 text-muted-foreground text-xs">{o.statut}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Saisir une valeur</CardTitle>
        </CardHeader>
        <CardContent>
          <AddValeurForm indicateurId={ind.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des valeurs</CardTitle>
        </CardHeader>
        <CardContent>
          {(valeurs ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune valeur saisie.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...(valeurs ?? [])].reverse().map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{formatDate(v.date_mesure)}</TableCell>
                    <TableCell className="font-medium">
                      {v.valeur} {ind.unite ?? ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.commentaire ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
