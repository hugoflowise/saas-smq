import { Award } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { COMPETENCE_STATUT_LABELS, type EtatEcheance, etatEcheance } from "@/lib/competences";
import { nomComplet } from "@/lib/effectif";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { AttributionDialog } from "./attribution-dialog";
import { CompetenceDelete } from "./competence-delete";
import { CompetenceDialog } from "./competence-dialog";
import { JustificatifLink } from "./justificatif-link";

// Couleurs et libellés de l'état d'échéance d'une habilitation.
const ECHEANCE_META: Record<EtatEcheance, { label: string; cls: string }> = {
  aucune: { label: "-", cls: "text-muted-foreground" },
  valide: { label: "Valide", cls: "bg-status-conforme/15 text-status-conforme" },
  bientot: { label: "Bientôt expirée", cls: "bg-status-pa/15 text-status-pa" },
  expiree: { label: "Expirée", cls: "bg-status-nc-mineure/15 text-status-nc-mineure" },
};

const STATUT_CLS: Record<string, string> = {
  acquise: "bg-status-conforme/15 text-status-conforme",
  a_acquerir: "bg-status-pa/15 text-status-pa",
  a_recycler: "bg-status-nc-mineure/15 text-status-nc-mineure",
};

export default async function CompetencesPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Compétences"
          description="Preuves de compétence par personne (ISO 9001 §7.2)."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: consultantsData }, { data: competencesData }, { data: attributionsData }] =
    await Promise.all([
      supabase
        .from("consultants")
        .select("id, nom, prenom")
        .eq("tenant_id", ctx.effectiveTenantId)
        .order("nom", { ascending: true }),
      supabase
        .from("competences")
        .select("id, libelle, categorie, description")
        .eq("tenant_id", ctx.effectiveTenantId)
        .order("libelle", { ascending: true }),
      supabase
        .from("competences_personnes")
        .select(
          "id, consultant_id, competence_id, niveau_requis, niveau_acquis, statut, date_obtention, date_echeance, organisme, commentaire, justificatif_nom",
        )
        .eq("tenant_id", ctx.effectiveTenantId)
        .order("date_echeance", { ascending: true, nullsFirst: false }),
    ]);

  const consultants = consultantsData ?? [];
  const competences = competencesData ?? [];
  const attributions = attributionsData ?? [];

  const consultantsMin = consultants.map((c) => ({ id: c.id, nom: nomComplet(c) }));
  const competencesMin = competences.map((c) => ({ id: c.id, libelle: c.libelle }));
  const nomById = new Map(consultantsMin.map((c) => [c.id, c.nom]));
  const competenceById = new Map(competences.map((c) => [c.id, c.libelle]));

  // Statistiques : compétences au référentiel, attributions, habilitations
  // expirées / bientôt expirées (logique de date partagée).
  const echeances = attributions.map((a) => etatEcheance(a.date_echeance));
  const expirees = echeances.filter((e) => e === "expiree").length;
  const bientot = echeances.filter((e) => e === "bientot").length;

  const tiles = [
    { label: "Compétences (référentiel)", value: competences.length, cls: "text-foreground" },
    { label: "Attributions", value: attributions.length, cls: "text-foreground" },
    {
      label: "Expirées",
      value: expirees,
      cls: expirees > 0 ? "text-status-nc-mineure" : "text-muted-foreground",
    },
    {
      label: "À renouveler (60 j)",
      value: bientot,
      cls: bientot > 0 ? "text-status-pa" : "text-muted-foreground",
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Compétences"
        description="Compétences requises/acquises, formations et habilitations avec échéances et pièces justificatives."
        concept="competences"
        help="§7.2 exige de conserver les preuves de compétence du personnel dont le travail influe sur la performance du SMQ. Renseignez par personne les compétences acquises/à acquérir, les dates d'obtention et d'échéance des habilitations, l'organisme, et joignez l'attestation/diplôme/habilitation. Les échéances dépassées ou proches (60 jours) sont mises en évidence."
      >
        {consultants.length > 0 && competences.length > 0 ? (
          <AttributionDialog consultants={consultantsMin} competences={competencesMin} />
        ) : null}
        <CompetenceDialog />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <StatTiles tiles={tiles} />

        {consultants.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Aucune personne dans l'effectif"
            description="Ajoutez d'abord des personnes dans Effectif & couverture pour leur attribuer des compétences."
          />
        ) : competences.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Aucune compétence au référentiel"
            description="Créez vos compétences (habilitations, métiers…) puis attribuez-les aux personnes."
          />
        ) : attributions.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Aucune attribution"
            description="Attribuez une compétence à une personne pour consigner ses preuves de compétence."
          />
        ) : (
          <div className="rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personne</TableHead>
                  <TableHead>Compétence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Requis / acquis</TableHead>
                  <TableHead>Obtention</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Justificatif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributions.map((a) => {
                  const etat = etatEcheance(a.date_echeance);
                  const meta = ECHEANCE_META[etat];
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <AttributionDialog
                          attribution={a}
                          consultants={consultantsMin}
                          competences={competencesMin}
                          trigger={
                            <button type="button" className={ROW_NAME_BUTTON}>
                              {nomById.get(a.consultant_id) ?? "-"}
                            </button>
                          }
                        />
                      </TableCell>
                      <TableCell>{competenceById.get(a.competence_id) ?? "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`${BADGE_BASE} ${STATUT_CLS[a.statut] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {COMPETENCE_STATUT_LABELS[a.statut] ?? a.statut}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {a.niveau_requis ?? "-"} / {a.niveau_acquis ?? "-"}
                      </TableCell>
                      <TableCell>{formatDate(a.date_obtention)}</TableCell>
                      <TableCell>{formatDate(a.date_echeance)}</TableCell>
                      <TableCell>
                        {etat === "aucune" ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className={`${BADGE_BASE} ${meta.cls}`}>{meta.label}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.justificatif_nom ? (
                          <JustificatifLink id={a.id} nom={a.justificatif_nom} />
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {competences.length > 0 ? (
          <div className="rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-medium text-sm">Référentiel des compétences</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {competences.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <CompetenceDialog
                        competence={c}
                        trigger={
                          <button type="button" className={ROW_NAME_BUTTON}>
                            {c.libelle}
                          </button>
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.categorie ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.description ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CompetenceDelete id={c.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
