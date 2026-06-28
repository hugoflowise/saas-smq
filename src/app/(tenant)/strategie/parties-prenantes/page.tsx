import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProposeBadge } from "@/components/propose-badge";
import { ProposeBanner, RefuserButton, ValiderButton } from "@/components/propose-controls";
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
import { formatDate, nomPersonne } from "@/lib/format";
import {
  INTERACTION_LABELS,
  PRIORITE_CLASS,
  PRIORITE_LABELS,
  prioriteFromTotal,
  SPHERE_LABELS,
  scoreTotal,
} from "@/lib/parties-prenantes";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { Cartographie } from "./cartographie";
import { PartieDialog } from "./partie-dialog";
import { PartiesPrenantesReference } from "./parties-prenantes-reference";
import type { PartiesPrenantesSnapshot } from "./parties-prenantes-snapshot";
import {
  PartiesPrenantesVersionHistory,
  type PartiesPrenantesVersionItem,
} from "./parties-prenantes-version-history";
import { PublierPartiesPrenantesButton } from "./publier-parties-prenantes-button";

export default async function PartiesPrenantesPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Parties prenantes"
          description="Registre des parties intéressées et de leurs attentes."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour gérer ses parties prenantes."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const [{ data: parties }, { data: attentes }, { data: tenant }] = await Promise.all([
    supabase
      .from("parties_interessees")
      .select(
        "id, nom, sphere, type, niveau_interaction, pouvoir, legitimite, urgence, propose, valide_le",
      )
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("nom", { ascending: true }),
    supabase.from("pi_attentes").select("partie_id").eq("tenant_id", tid).is("deleted_at", null),
    supabase
      .from("tenants")
      .select("nom_societe, parties_prenantes_reference")
      .eq("id", tid)
      .maybeSingle(),
  ]);
  const nomSociete = tenant?.nom_societe ?? "Notre organisme";

  // Versions figées (la plus récente = courante).
  const { data: rawVersions } = await supabase
    .from("parties_prenantes_versions")
    .select("id, version, created_at, published_by, snapshot")
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });
  const publisherIds = [
    ...new Set((rawVersions ?? []).map((v) => v.published_by).filter((id): id is string => !!id)),
  ];
  const { data: publishers } = publisherIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", publisherIds)
    : { data: [] };
  const nameById = new Map(
    (publishers ?? []).map((p) => [p.id, nomPersonne(p.full_name, p.email)]),
  );
  const versions: PartiesPrenantesVersionItem[] = (rawVersions ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    publishedAt: v.created_at,
    publisher: v.published_by ? (nameById.get(v.published_by) ?? null) : null,
    snapshot: v.snapshot as unknown as PartiesPrenantesSnapshot | null,
  }));
  const currentVersion = versions[0] ?? null;

  const attentesCount = new Map<string, number>();
  for (const a of attentes ?? []) {
    attentesCount.set(a.partie_id, (attentesCount.get(a.partie_id) ?? 0) + 1);
  }

  const items = (parties ?? []).map((p) => {
    const total = scoreTotal(p.pouvoir, p.legitimite, p.urgence);
    return {
      ...p,
      total,
      priorite: prioriteFromTotal(total),
      nbAttentes: attentesCount.get(p.id) ?? 0,
    };
  });
  const tri = [...items].sort((a, b) => b.total - a.total);

  /** Un élément « proposé » non encore validé n'est pas comptabilisé. */
  const estAValider = (p: { propose: boolean; valide_le: string | null }) =>
    p.propose && !p.valide_le;
  const aValider = items.filter(estAValider).length;
  // Les compteurs ne tiennent compte que des parties prenantes validées.
  const comptes = items.filter((p) => !estAValider(p));

  const hautes = comptes.filter((p) => p.priorite === 3).length;
  const internes = comptes.filter((p) => p.sphere === "interne").length;

  const tiles = [
    { label: "Parties prenantes", value: comptes.length, cls: "text-foreground" },
    { label: "Priorité haute", value: hautes, cls: "text-status-nc-mineure" },
    { label: "Sphère interne", value: internes, cls: "text-primary" },
    { label: "Sphère externe", value: comptes.length - internes, cls: "text-foreground" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Parties prenantes"
        description="Cartographie, cotation de saillance et registre des attentes."
        isoClause="ISO 9001 §4.2"
        help="Identifiez les parties intéressées pertinentes et leurs attentes. Cotez leur saillance (Pouvoir, Légitimité, Urgence, chacun de 1 à 3) : la priorité et la criticité résiduelle de chaque attente sont calculées automatiquement. Ouvrez une partie prenante pour gérer ses attentes (risque, opportunité, maîtrise, action)."
      >
        <PublierPartiesPrenantesButton />
        <PartieDialog />
      </PageHeader>

      {/* Référence documentaire + version courante figée. */}
      <div className="-mt-2 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
        <PartiesPrenantesReference initial={tenant?.parties_prenantes_reference ?? null} />
        {currentVersion ? (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span>
              Version <span className="font-medium text-foreground">{currentVersion.version}</span>{" "}
              · figée le {formatDate(currentVersion.publishedAt)}
              {currentVersion.publisher ? ` par ${currentVersion.publisher}` : ""}
            </span>
          </>
        ) : (
          <span>
            <span className="text-muted-foreground/50">·</span> Aucune version figée. « Publier une
            version » pour archiver l'état actuel.
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune partie prenante"
          description="Recensez vos parties intéressées (dirigeants, collaborateurs, clients, autorités…) et cotez leur saillance."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <ProposeBanner table="parties_interessees" count={aValider} libelle="parties prenantes" />
          <StatTiles tiles={tiles} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cartographie des parties prenantes</CardTitle>
            </CardHeader>
            <CardContent>
              <Cartographie
                societe={nomSociete}
                parties={items.map((p) => ({
                  id: p.id,
                  nom: p.nom,
                  sphere: p.sphere,
                  priorite: p.priorite,
                }))}
              />
            </CardContent>
          </Card>

          <div className="rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partie prenante</TableHead>
                  <TableHead>Sphère</TableHead>
                  <TableHead>Interaction</TableHead>
                  <TableHead className="text-center">P / L / U</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Attentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tri.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/strategie/parties-prenantes/${p.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {p.nom}
                        </Link>
                        {estAValider(p) ? <ProposeBadge /> : null}
                        {estAValider(p) ? (
                          <>
                            <RefuserButton table="parties_interessees" id={p.id} />
                            <ValiderButton table="parties_interessees" id={p.id} />
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {SPHERE_LABELS[p.sphere] ?? p.sphere}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {INTERACTION_LABELS[p.niveau_interaction] ?? p.niveau_interaction}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {p.pouvoir} / {p.legitimite} / {p.urgence}
                    </TableCell>
                    <TableCell className="font-medium">{p.total}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${PRIORITE_CLASS[p.priorite]}`}
                      >
                        {PRIORITE_LABELS[p.priorite]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.nbAttentes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Historique des versions figées (consultables en lecture seule). */}
      <details className="group mt-8 rounded-lg border bg-surface text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground">
          <span className="font-medium">Historique des versions ({versions.length})</span>
          <span className="ml-auto text-xs group-open:hidden">Afficher</span>
          <span className="ml-auto hidden text-xs group-open:inline">Masquer</span>
        </summary>
        <div className="border-t p-3">
          <PartiesPrenantesVersionHistory versions={versions} />
        </div>
      </details>
    </div>
  );
}
