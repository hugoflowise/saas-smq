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
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { AddValeurForm } from "./add-valeur-form";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export default async function IndicateurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/indicateurs");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: ind } = await supabase
    .from("indicateurs")
    .select(
      "id, nom, description, unite, cible, seuil_alerte_min, seuil_alerte_max, frequence_mesure",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!ind) notFound();

  const { data: valeurs } = await supabase
    .from("indicateurs_valeurs")
    .select("id, valeur, date_mesure, commentaire")
    .eq("indicateur_id", id)
    .order("date_mesure", { ascending: true });

  const points = (valeurs ?? []).map((v) => ({
    date: formatDate(v.date_mesure),
    valeur: Number(v.valeur),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/indicateurs"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Indicateurs
      </Link>

      <PageHeader title={ind.nom} description={ind.description ?? undefined} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Évolution {ind.unite ? `(${ind.unite})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <KpiChart data={points} cible={ind.cible} unite={ind.unite} />
        </CardContent>
      </Card>

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
                    <TableCell className="text-muted-foreground">{v.commentaire ?? "—"}</TableCell>
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
