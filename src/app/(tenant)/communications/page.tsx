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
import {
  appliquerVariables,
  MODELE_CATEGORIES,
  MODELES_INTEGRES,
  type Modele,
} from "@/lib/communications";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ROW_NAME_BUTTON } from "@/lib/ui-classes";
import { EnvoyerModeleDialog } from "./envoyer-modele-dialog";
import { ModeleDelete } from "./modele-delete";
import { ModeleDialog } from "./modele-dialog";

export default async function CommunicationsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Communications"
          description="Modèles d'e-mails et communication interne sur le SMQ."
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

  const [{ data: tenant }, { data: customs }, { data: envois }] = await Promise.all([
    supabase.from("tenants").select("nom_societe, liste_diffusion").eq("id", tid).maybeSingle(),
    supabase
      .from("communication_modeles")
      .select("id, categorie, titre, objet, corps, pieces_jointes")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("titre"),
    supabase
      .from("communications")
      .select("id, sujet, audience, date_realisee, date_prevue, statut")
      .eq("tenant_id", tid)
      .order("date_realisee", { ascending: false, nullsFirst: false })
      .limit(50),
  ]);

  const societe = tenant?.nom_societe ?? "votre société";
  const listeDiffusion = tenant?.liste_diffusion ?? null;

  // Modèles fournis + personnalisés, regroupés par catégorie.
  const customModeles: Modele[] = (customs ?? []).map((m) => {
    const { pieces_jointes, ...rest } = m;
    return {
      ...rest,
      integre: false,
      pieces: (pieces_jointes ?? []) as Modele["pieces"],
    };
  });
  const tousModeles = [...MODELES_INTEGRES, ...customModeles];
  const categoriesPresentes = Object.keys(MODELE_CATEGORIES).filter((cat) =>
    tousModeles.some((m) => m.categorie === cat),
  );

  const historique = envois ?? [];

  return (
    <div className="w-full">
      <PageHeader
        title="Communications"
        description="Bibliothèque de modèles d'e-mails (EPI, formations, ODM…) à envoyer en un clic."
        isoClause="ISO 9001 §7.4"
        help="Cliquez un modèle pour préparer l'e-mail : objet et message sont modifiables avant l'envoi, puis l'e-mail s'ouvre dans votre messagerie (Outlook) prêt à partir à une personne ou à toute la société. Chaque envoi est journalisé (traçabilité ISO §7.4). Pour l'option « toute la société », renseignez une adresse de liste de diffusion (créée dans Microsoft 365) dans Paramètres → Informations société."
      >
        <ModeleDialog mode="creer" />
      </PageHeader>

      {/* Bibliothèque de modèles */}
      <div className="flex flex-col gap-6">
        {categoriesPresentes.map((cat) => {
          const modeles = tousModeles.filter((m) => m.categorie === cat);
          return (
            <section key={cat}>
              <h2 className="mb-2 font-semibold text-sm">{MODELE_CATEGORIES[cat]}</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {modeles.map((m) => (
                  <Card key={m.id} className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col gap-2 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <EnvoyerModeleDialog
                          modele={m}
                          societe={societe}
                          listeDiffusion={listeDiffusion}
                          trigger={
                            <button type="button" className={`${ROW_NAME_BUTTON} text-sm`}>
                              {m.titre}
                            </button>
                          }
                        />
                        {m.integre ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            Fourni
                          </span>
                        ) : null}
                      </div>
                      <p className="line-clamp-2 flex-1 text-muted-foreground text-xs">
                        {appliquerVariables(m.objet, { societe })}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <EnvoyerModeleDialog
                          modele={m}
                          societe={societe}
                          listeDiffusion={listeDiffusion}
                        />
                        {m.integre ? (
                          <ModeleDialog mode="dupliquer" modele={m} />
                        ) : (
                          <>
                            <ModeleDialog mode="modifier" modele={m} />
                            <ModeleDelete id={m.id} titre={m.titre} />
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Historique des envois (traçabilité §7.4) */}
      <h2 className="mt-8 mb-2 font-semibold text-sm">Historique des communications</h2>
      {historique.length === 0 ? (
        <EmptyState
          title="Aucune communication envoyée"
          description="Envoyez une communication depuis un modèle : elle apparaîtra ici pour la traçabilité."
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sujet</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historique.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.sujet}</TableCell>
                  <TableCell className="text-muted-foreground">{c.audience ?? "-"}</TableCell>
                  <TableCell>{formatDate(c.date_realisee ?? c.date_prevue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
