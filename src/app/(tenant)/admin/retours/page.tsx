import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, nomPersonne } from "@/lib/format";
import { RETOUR_STATUT_LABELS, RETOUR_TYPE_LABELS } from "@/lib/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { RetourDialog } from "./retour-dialog";

// Couleur du statut : les sujets à traiter ressortent (ambre / bleu),
// les traités passent au vert et les rejetés en gris discret.
const STATUT_BADGE: Record<string, string> = {
  nouveau: "bg-status-pa/15 text-status-pa",
  en_cours: "bg-primary/10 text-primary",
  traite: "bg-status-conforme/15 text-status-conforme",
  rejete: "bg-muted text-muted-foreground",
};

// Ordre d'affichage : à traiter en premier, traités/rejetés relégués en bas.
const STATUT_ORDRE: Record<string, number> = {
  nouveau: 0,
  en_cours: 1,
  traite: 2,
  rejete: 3,
};

export default async function AdminRetoursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  if (profile?.role !== "admin_flowise") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: retoursData } = await admin
    .from("retours")
    .select(
      "id, numero, tenant_id, type, titre, description, page_url, statut, note_admin, created_at, created_by",
    )
    .order("created_at", { ascending: false });
  // Tri stable : on garde l'ordre chronologique (récent → ancien) à l'intérieur de
  // chaque statut, mais on remonte les statuts « à traiter » en haut du tableau.
  const retours = (retoursData ?? [])
    .slice()
    .sort((a, b) => (STATUT_ORDRE[a.statut] ?? 9) - (STATUT_ORDRE[b.statut] ?? 9));

  // Auteurs + sociétés (pour le contexte)
  const authorIds = [...new Set(retours.map((r) => r.created_by).filter(Boolean) as string[])];
  const tenantIds = [...new Set(retours.map((r) => r.tenant_id).filter(Boolean) as string[])];
  const fallback = ["00000000-0000-0000-0000-000000000000"];
  const [{ data: authors }, { data: tenants }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authorIds.length ? authorIds : fallback),
    admin
      .from("tenants")
      .select("id, nom_societe")
      .in("id", tenantIds.length ? tenantIds : fallback),
  ]);
  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));
  const tenantById = new Map((tenants ?? []).map((t) => [t.id, t.nom_societe]));

  const nouveaux = retours.filter((r) => r.statut === "nouveau").length;
  const enCours = retours.filter((r) => r.statut === "en_cours").length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Signalements & suggestions"
        description="Bugs, remarques et demandes d'évolution remontés par les utilisateurs."
      />

      {retours.length === 0 ? (
        <EmptyState
          title="Aucun retour"
          description="Les retours envoyés depuis l'app (bouton « Signaler / Suggérer ») apparaîtront ici."
        />
      ) : (
        <>
          <div className="mb-4 flex gap-3 text-sm">
            <span className="rounded-lg border bg-card px-3 py-1.5">
              <strong>{nouveaux}</strong> nouveau{nouveaux > 1 ? "x" : ""}
            </span>
            <span className="rounded-lg border bg-card px-3 py-1.5">
              <strong>{enCours}</strong> en cours
            </span>
            <span className="rounded-lg border bg-card px-3 py-1.5">
              <strong>{retours.length}</strong> au total
            </span>
          </div>

          <div className="rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">N°</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Date &amp; heure</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retours.map((r) => {
                  const author = r.created_by ? authorById.get(r.created_by) : null;
                  const auteurNom = author ? nomPersonne(author.full_name, author.email) : "—";
                  const clientNom = r.tenant_id ? (tenantById.get(r.tenant_id) ?? null) : null;
                  // Les retours clos (traité / rejeté) sont atténués pour faire
                  // ressortir les sujets encore à traiter.
                  const clos = r.statut === "traite" || r.statut === "rejete";
                  return (
                    <RetourDialog
                      key={r.id}
                      retour={{
                        id: r.id,
                        numero: r.numero,
                        type: RETOUR_TYPE_LABELS[r.type],
                        titre: r.titre,
                        description: r.description,
                        pageUrl: r.page_url,
                        statut: r.statut,
                        noteAdmin: r.note_admin,
                        auteur: auteurNom,
                        auteurEmail: author?.email ?? null,
                        client: clientNom,
                        date: formatDateTime(r.created_at),
                      }}
                      trigger={
                        <TableRow
                          className={`cursor-pointer hover:bg-muted/40 ${clos ? "opacity-55" : ""}`}
                        >
                          <TableCell className="font-mono text-muted-foreground text-sm">
                            #{r.numero}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {RETOUR_TYPE_LABELS[r.type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="block truncate font-medium">{r.titre}</span>
                            {r.page_url ? (
                              <span className="block truncate font-mono text-muted-foreground text-xs">
                                {r.page_url}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <span className="block">{auteurNom}</span>
                            {author?.email && author.full_name ? (
                              <span className="block text-muted-foreground text-xs">
                                {author.email}
                              </span>
                            ) : null}
                            {clientNom ? (
                              <span className="block text-muted-foreground text-xs">
                                {clientNom}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                            {formatDateTime(r.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUT_BADGE[r.statut] ?? "bg-secondary"}>
                              {RETOUR_STATUT_LABELS[r.statut]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      }
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
