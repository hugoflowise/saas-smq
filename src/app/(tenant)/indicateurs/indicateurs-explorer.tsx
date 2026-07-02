"use client";

import { LayoutGrid, Table as TableIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { KpiChart } from "@/components/kpi-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cibleAffichee, horsCible } from "@/lib/indicateurs";

export type IndicateurSuivi = {
  id: string;
  nom: string;
  unite: string | null;
  cible: number | null;
  cibleTexte?: string | null;
  sens: string;
  processusId: string | null;
  processusNom: string | null;
  objectifs: string[];
  last: { valeur: number; date: string } | null;
  valeursParPeriode: Record<string, number>;
  serie: { date: string; valeur: number }[];
  lieAObjectif: boolean;
};

/** Un groupe d'indicateurs (une section par processus). */
export type GroupeIndicateurs = {
  id: string;
  nom: string;
  indicateurs: IndicateurSuivi[];
};

/** Vue de suivi des indicateurs : bascule cartes ↔ tableau de bord (périodes en colonnes). */
export function IndicateursExplorer({
  groupes,
  periodes,
}: {
  groupes: GroupeIndicateurs[];
  /** Colonnes du tableau : [{ cle: "2026-06", label: "juin 26" }, …] du plus ancien au plus récent. */
  periodes: { cle: string; label: string }[];
}) {
  const [vue, setVue] = useState<"cartes" | "tableau">("tableau");

  // En-têtes de section : masqués uniquement s'il n'y a que le groupe « Sans processus ».
  const afficherEntetes = groupes.length > 1 || groupes[0]?.id !== "none";

  // Tous les indicateurs à plat (pour la section des graphes).
  const tousIndicateurs = groupes.flatMap((g) => g.indicateurs);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="inline-flex overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setVue("tableau")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${vue === "tableau" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <TableIcon className="size-4" /> Tableau
          </button>
          <button
            type="button"
            onClick={() => setVue("cartes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${vue === "cartes" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <LayoutGrid className="size-4" /> Cartes
          </button>
        </div>
      </div>

      {vue === "tableau" ? (
        <div className="flex flex-col gap-8">
          {groupes.map((g) => (
            <section key={g.id} className="flex flex-col gap-2">
              {afficherEntetes ? (
                <h2 className="font-semibold text-primary text-sm">
                  {g.nom} <span className="text-muted-foreground">({g.indicateurs.length})</span>
                </h2>
              ) : null}
              <div className="overflow-x-auto rounded-2xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">Indicateur</TableHead>
                      <TableHead>Objectif</TableHead>
                      <TableHead className="text-right">Cible</TableHead>
                      {periodes.map((p) => (
                        <TableHead key={p.cle} className="text-right whitespace-nowrap">
                          {p.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.indicateurs.map((ind) => (
                      <TableRow key={ind.id}>
                        <TableCell className="sticky left-0 bg-card font-medium">
                          <Link href={`/indicateurs/${ind.id}`} className="hover:text-primary">
                            {ind.nom}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {ind.objectifs.length ? ind.objectifs.join(", ") : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm">
                          {ind.cible !== null || ind.cibleTexte?.trim()
                            ? cibleAffichee(ind.cible, ind.sens, ind.unite, ind.cibleTexte)
                            : "-"}
                        </TableCell>
                        {periodes.map((p) => {
                          const v = ind.valeursParPeriode[p.cle];
                          const alerte =
                            v !== undefined && horsCible(v, ind.cible, ind.sens, ind.cibleTexte);
                          return (
                            <TableCell
                              key={p.cle}
                              className={`text-right text-sm ${alerte ? "font-medium text-status-nc-mineure" : ""}`}
                            >
                              {v !== undefined ? v : ""}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}

          {/* Graphes d'évolution sous les tableaux (un par indicateur ayant des valeurs). */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {tousIndicateurs
              .filter((ind) => ind.serie.length > 0)
              .map((ind) => (
                <div key={ind.id} className="rounded-2xl border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Link
                      href={`/indicateurs/${ind.id}`}
                      className="font-medium text-sm hover:text-primary"
                    >
                      {ind.nom}
                    </Link>
                    {ind.cible !== null || ind.cibleTexte?.trim() ? (
                      <span className="text-muted-foreground text-xs">
                        Cible : {cibleAffichee(ind.cible, ind.sens, ind.unite, ind.cibleTexte)}
                      </span>
                    ) : null}
                  </div>
                  <KpiChart data={ind.serie} cible={ind.cible} unite={ind.unite} />
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupes.map((g) => (
            <section key={g.id} className="flex flex-col gap-3">
              {afficherEntetes ? (
                <h2 className="font-semibold text-primary text-sm">
                  {g.nom} <span className="text-muted-foreground">({g.indicateurs.length})</span>
                </h2>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.indicateurs.map((ind) => {
                  const alerte =
                    ind.last && horsCible(ind.last.valeur, ind.cible, ind.sens, ind.cibleTexte);
                  return (
                    <Link key={ind.id} href={`/indicateurs/${ind.id}`}>
                      <Card className="h-full transition-colors hover:border-primary/40">
                        <CardHeader>
                          <CardTitle className="text-sm">{ind.nom}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-baseline gap-1">
                            <span className="font-semibold text-2xl">
                              {ind.last ? ind.last.valeur : "-"}
                            </span>
                            {ind.unite ? (
                              <span className="text-muted-foreground text-sm">{ind.unite}</span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                            {ind.cible !== null || ind.cibleTexte?.trim() ? (
                              <span>
                                Cible :{" "}
                                {cibleAffichee(ind.cible, ind.sens, ind.unite, ind.cibleTexte)}
                              </span>
                            ) : null}
                            {alerte ? (
                              <span className="rounded-full bg-status-nc-mineure/15 px-2 py-0.5 font-medium text-status-nc-mineure">
                                Hors cible
                              </span>
                            ) : null}
                            {!ind.lieAObjectif ? (
                              <span className="rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-status-pa">
                                Sans objectif
                              </span>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
