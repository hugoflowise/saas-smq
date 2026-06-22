import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { FournisseurDialog } from "./fournisseur-dialog";

const CRITICITE_LABELS: Record<string, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  critique: "Critique",
};
const CRITICITE_CLASS: Record<string, string> = {
  faible: "bg-status-conforme/15 text-status-conforme",
  moyenne: "bg-status-pa/15 text-status-pa",
  critique: "bg-status-nc-mineure/15 text-status-nc-mineure",
};

export default async function FournisseursPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader title="Fournisseurs" description="Évaluation des prestataires externes." />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const today = todayISO();
  const { data: fournisseurs } = await supabase
    .from("fournisseurs")
    .select(
      "id, nom, categorie, contact, criticite, note_evaluation, date_evaluation, prochaine_evaluation, statut, commentaire",
    )
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("nom", { ascending: true });

  const items = fournisseurs ?? [];
  const critiques = items.filter((f) => f.criticite === "critique").length;
  const notes = items.map((f) => f.note_evaluation).filter((n): n is number => n != null);
  const noteMoyenne =
    notes.length > 0
      ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
      : null;
  const aReevaluer = items.filter(
    (f) => f.statut === "actif" && (!f.prochaine_evaluation || f.prochaine_evaluation <= today),
  ).length;

  const tiles = [
    { label: "Fournisseurs", value: items.length, cls: "text-foreground" },
    { label: "Critiques", value: critiques, cls: "text-status-nc-mineure" },
    { label: "Note moyenne /5", value: noteMoyenne ?? "-", cls: "text-status-conforme" },
    { label: "À (ré)évaluer", value: aReevaluer, cls: "text-status-pa" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Fournisseurs"
        description="Évaluation et maîtrise des prestataires externes."
        isoClause="ISO 9001 §8.4"
        help="Évaluez et surveillez vos prestataires externes selon leur impact. Soyez exhaustif : sous-traitants, intérim, formation, EPI, mais aussi banque, mutuelle, etc. Tout prestataire ayant un impact sur la qualité est concerné."
      >
        <FournisseurDialog />
      </PageHeader>

      {items.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          title="Aucun fournisseur"
          description="Recensez vos prestataires externes et évaluez ceux qui ont un impact qualité."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Criticité</TableHead>
                <TableHead>Évaluation</TableHead>
                <TableHead>Prochaine éval.</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <FournisseurDialog
                      fournisseur={f}
                      trigger={
                        <button type="button" className={ROW_NAME_BUTTON}>
                          {f.nom}
                        </button>
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.categorie ?? "-"}</TableCell>
                  <TableCell>
                    <span className={`${BADGE_BASE} ${CRITICITE_CLASS[f.criticite] ?? "bg-muted"}`}>
                      {CRITICITE_LABELS[f.criticite] ?? f.criticite}
                    </span>
                  </TableCell>
                  <TableCell>
                    {f.note_evaluation != null ? `${f.note_evaluation}/5` : "-"}
                  </TableCell>
                  <TableCell>{formatDate(f.prochaine_evaluation)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {f.statut === "actif" ? "Actif" : "Inactif"}
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
