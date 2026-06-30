import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import { SupprimerButton } from "@/components/supprimer-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteRisqueAction, deleteUniteAction } from "@/lib/actions/duerp";
import { duerpNiveauClasse } from "@/lib/duerp";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { FamillesDialog } from "./familles-dialog";
import { RisqueStatutCell } from "./inline-cells";
import { RisqueDialog, type RisqueRow } from "./risque-dialog";
import { UniteDialog, type UniteRow } from "./unite-dialog";

export default async function DuerpPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Document unique (DUERP)"
          description="Évaluation des risques professionnels par unité de travail."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: unites }, { data: risques }, { data: familles }] = await Promise.all([
    supabase
      .from("duerp_unites_travail")
      .select("id, libelle, description, effectif_concerne, ordre")
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("ordre")
      .order("libelle"),
    supabase
      .from("duerp_risques")
      .select(
        "id, unite_id, famille_id, danger, situation_exposition, gravite_brute, frequence_brute, niveau_brut, mesures_existantes, gravite_residuelle, frequence_residuelle, niveau_residuel, statut",
      )
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("niveau_brut", { ascending: false }),
    supabase
      .from("duerp_familles")
      .select("id, libelle")
      .eq("tenant_id", ctx.effectiveTenantId)
      .order("ordre")
      .order("libelle"),
  ]);

  const unitesList = unites ?? [];
  const risquesList = risques ?? [];
  const famillesList = familles ?? [];
  const familleLabel = new Map(famillesList.map((f) => [f.id, f.libelle]));

  const critiques = risquesList.filter((r) => (r.niveau_brut ?? 0) >= 9).length;
  const nonMaitrises = risquesList.filter((r) => r.statut !== "maitrise").length;
  const tiles = [
    { label: "Unités de travail", value: unitesList.length, cls: "text-foreground" },
    { label: "Risques évalués", value: risquesList.length, cls: "text-foreground" },
    { label: "Risques critiques", value: critiques, cls: "text-status-nc-majeure" },
    { label: "Non maîtrisés", value: nonMaitrises, cls: "text-status-pa" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Document unique (DUERP)"
        description="Évaluation des risques professionnels par unité de travail."
        isoClause="Code du travail L4121-3 · R4121-1"
        help="Le DUERP est obligatoire dès le premier salarié. Décrivez vos unités de travail (poste, atelier, chantier…), recensez les risques par famille, cotez gravité × fréquence (avant et après mesures), puis pilotez les actions de prévention. À mettre à jour au moins une fois par an et à chaque changement notable."
      >
        <div className="flex flex-wrap gap-2">
          <FamillesDialog familles={famillesList} />
          <UniteDialog />
        </div>
      </PageHeader>

      {unitesList.length > 0 ? <StatTiles tiles={tiles} className="mb-6" /> : null}

      {unitesList.length === 0 ? (
        <EmptyState
          title="Aucune unité de travail"
          description="Commencez par créer une unité de travail (poste, atelier, chantier…), puis recensez ses risques."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {unitesList.map((unite) => {
            const items = risquesList.filter((r) => r.unite_id === unite.id);
            return (
              <section key={unite.id} className="rounded-2xl border bg-card">
                <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
                  <div>
                    <h2 className="font-semibold">{unite.libelle}</h2>
                    {unite.effectif_concerne != null ? (
                      <p className="text-muted-foreground text-xs">
                        {unite.effectif_concerne} personne
                        {unite.effectif_concerne > 1 ? "s" : ""} concernée
                        {unite.effectif_concerne > 1 ? "s" : ""}
                      </p>
                    ) : null}
                    {unite.description ? (
                      <p className="mt-1 text-muted-foreground text-sm">{unite.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <UniteDialog unite={unite as UniteRow} />
                    <SupprimerButton
                      action={deleteUniteAction}
                      id={unite.id}
                      libelle={`l'unité « ${unite.libelle} »`}
                      iconOnly
                    />
                  </div>
                </header>

                {items.length === 0 ? (
                  <div className="flex flex-col items-start gap-3 px-4 py-4">
                    <p className="text-muted-foreground text-sm">Aucun risque recensé.</p>
                    <RisqueDialog uniteId={unite.id} familles={famillesList} />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Danger</TableHead>
                          <TableHead>Famille</TableHead>
                          <TableHead className="w-28">Niveau brut</TableHead>
                          <TableHead className="w-28">Résiduel</TableHead>
                          <TableHead className="w-36">Statut</TableHead>
                          <TableHead className="w-16" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((r) => {
                          const brut = duerpNiveauClasse(r.niveau_brut);
                          const resid = duerpNiveauClasse(r.niveau_residuel);
                          return (
                            <TableRow key={r.id}>
                              <TableCell>
                                <RisqueDialog
                                  uniteId={unite.id}
                                  risque={r as RisqueRow}
                                  familles={famillesList}
                                  trigger={
                                    <button type="button" className={ROW_NAME_BUTTON}>
                                      {r.danger}
                                    </button>
                                  }
                                />
                                {r.situation_exposition ? (
                                  <span className="block text-muted-foreground text-xs">
                                    {r.situation_exposition}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-sm">
                                {r.famille_id ? (familleLabel.get(r.famille_id) ?? "—") : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`font-medium ${brut.cls}`}>
                                  {r.niveau_brut} · {brut.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {r.niveau_residuel != null ? (
                                  <Badge variant="outline" className={`font-medium ${resid.cls}`}>
                                    {r.niveau_residuel} · {resid.label}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <RisqueStatutCell id={r.id} value={r.statut} />
                              </TableCell>
                              <TableCell>
                                <SupprimerButton
                                  action={deleteRisqueAction}
                                  id={r.id}
                                  libelle={`le risque « ${r.danger} »`}
                                  iconOnly
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="px-4 py-3">
                      <RisqueDialog uniteId={unite.id} familles={famillesList} />
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
