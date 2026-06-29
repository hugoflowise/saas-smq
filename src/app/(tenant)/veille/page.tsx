import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { SuggestionActions } from "./suggestion-actions";
import { VeilleDialog } from "./veille-dialog";
import { VeilleMotsCles } from "./veille-mots-cles";

const DOMAINE_LABELS: Record<string, string> = {
  travail: "Travail",
  qualite: "Qualité",
  environnement: "Environnement",
  securite: "Sécurité",
  rgpd: "RGPD",
  autre: "Autre",
};
const STATUT_LABELS: Record<string, string> = {
  a_analyser: "À analyser",
  analysee: "Analysée",
  integree: "Intégrée",
  sans_objet: "Sans objet",
};

export default async function VeillePage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Veille réglementaire"
          description="Textes applicables et analyse d'impact."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const [{ data: textes }, { data: tenant }, { data: suggestions }, { data: historique }] =
    await Promise.all([
      supabase
        .from("veille_reglementaire")
        .select(
          "id, reference, intitule, domaine, date_publication, date_application, impact_smq, actions_a_prevoir, lien, statut",
        )
        .eq("tenant_id", tid)
        .order("date_application", { ascending: false, nullsFirst: false }),
      supabase.from("tenants").select("veille_mots_cles").eq("id", tid).maybeSingle(),
      supabase
        .from("veille_suggestions")
        .select("id, titre, url, date_texte")
        .eq("tenant_id", tid)
        .eq("statut", "nouvelle")
        .is("deleted_at", null)
        .order("date_texte", { ascending: false, nullsFirst: false }),
      supabase
        .from("veille_suggestions")
        .select("id, titre, ref, source, created_at")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

  const items = textes ?? [];
  const motsCles = tenant?.veille_mots_cles ?? "";
  const suggs = suggestions ?? [];

  // Historique des collectes : on regroupe les suggestions importées par jour
  // (created_at = date d'import). La liste est déjà triée du plus récent au plus
  // ancien, donc l'ordre des jours est conservé (Map = ordre d'insertion).
  const historiqueList = historique ?? [];
  const derniereCollecte = historiqueList[0]?.created_at ?? null;
  const collectesParJour = new Map<string, { titre: string; ref: string; source: string }[]>();
  for (const s of historiqueList) {
    const jour = s.created_at.slice(0, 10);
    const arr = collectesParJour.get(jour) ?? [];
    arr.push({ titre: s.titre, ref: s.ref, source: s.source });
    collectesParJour.set(jour, arr);
  }
  const collectes = [...collectesParJour.entries()];

  const tiles = [
    { label: "Textes suivis", value: items.length, cls: "text-foreground" },
    {
      label: "À analyser",
      value: items.filter((t) => t.statut === "a_analyser").length,
      cls: "text-status-pa",
    },
    { label: "Suggestions à examiner", value: suggs.length, cls: "text-primary" },
    {
      label: "Dernière collecte",
      value: derniereCollecte ? formatDate(derniereCollecte) : "-",
      cls: "text-foreground",
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Veille réglementaire"
        description="Textes applicables et analyse d'impact."
        isoClause="Obligations légales & §4"
        help="Suivez les textes applicables (qualité, réglementaires) pertinents pour votre activité, évaluez leur impact et tracez les actions de mise en conformité."
      >
        <VeilleDialog />
      </PageHeader>

      <StatTiles tiles={tiles} className="mb-6" />

      {/* Configuration des mots-clés (suggestions automatiques) */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <VeilleMotsCles initial={motsCles} />
        </CardContent>
      </Card>

      {/* Suggestions de textes officiels à examiner */}
      {suggs.length > 0 ? (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold text-sm">Suggestions à examiner ({suggs.length})</h2>
          <div className="flex flex-col gap-2">
            {suggs.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{s.titre}</p>
                  <p className="text-muted-foreground text-xs">
                    {s.date_texte ? formatDate(s.date_texte) : ""}
                    {s.url ? (
                      <>
                        {" · "}
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener"
                          className="text-primary hover:underline"
                        >
                          Voir le texte
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <SuggestionActions id={s.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Historique des collectes automatiques (par date d'import) */}
      {collectes.length > 0 ? (
        <details className="mb-6 rounded-xl border bg-card">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-sm">
            Historique des collectes ({collectes.length})
          </summary>
          <div className="flex flex-col divide-y border-t">
            {collectes.map(([jour, textesJour]) => (
              <div key={jour} className="px-4 py-3">
                <p className="font-medium text-sm">
                  {formatDate(jour)}{" "}
                  <span className="text-muted-foreground text-xs">
                    · {textesJour.length} texte{textesJour.length > 1 ? "s" : ""} collecté
                    {textesJour.length > 1 ? "s" : ""}
                  </span>
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {textesJour.map((t, i) => (
                    <li
                      // biome-ignore lint/suspicious/noArrayIndexKey: textes d'une même collecte
                      key={`${jour}-${i}`}
                      className="text-muted-foreground text-xs"
                    >
                      <span className="font-mono">{t.ref}</span> · {t.titre}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun texte"
          description="Ajoutez les textes réglementaires applicables et leur impact sur le SMQ."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intitulé</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <VeilleDialog
                      veille={t}
                      trigger={
                        <button type="button" className={ROW_NAME_BUTTON}>
                          {t.intitule}
                        </button>
                      }
                    />
                    {t.lien ? (
                      <a
                        href={t.lien}
                        target="_blank"
                        rel="noopener"
                        className="mt-0.5 block text-primary text-xs hover:underline"
                      >
                        Voir le texte
                      </a>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {t.reference ?? "-"}
                  </TableCell>
                  <TableCell>{DOMAINE_LABELS[t.domaine] ?? t.domaine}</TableCell>
                  <TableCell>{formatDate(t.date_application)}</TableCell>
                  <TableCell>{STATUT_LABELS[t.statut] ?? t.statut}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
