import { Check } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { ProcessusLink } from "@/components/processus-link";
import { SupprimerButton } from "@/components/supprimer-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deletePartieAction } from "@/lib/actions/parties-prenantes";
import {
  criticiteClass,
  criticiteResiduelle,
  INTERACTION_LABELS,
  MAITRISE_LABELS,
  PRIORITE_CLASS,
  PRIORITE_LABELS,
  prioriteFromTotal,
  SPHERE_LABELS,
  scoreTotal,
} from "@/lib/parties-prenantes";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { PartieDialog } from "../partie-dialog";
import { AttenteDelete } from "./attente-delete";
import { AttenteDialog } from "./attente-dialog";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
      <span className="font-semibold text-lg">{value}</span>
    </div>
  );
}

export default async function PartieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/strategie/parties-prenantes");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: partie } = await supabase
    .from("parties_interessees")
    .select("id, nom, sphere, type, niveau_interaction, pouvoir, legitimite, urgence")
    .eq("id", id)
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .maybeSingle();
  if (!partie) notFound();

  const [{ data: attentes }, { data: processus }] = await Promise.all([
    supabase
      .from("pi_attentes")
      .select(
        "id, attente, risque, opportunite, maitrise, moyens_maitrise, processus_id, integration_pa, action, commentaire, ordre, created_at",
      )
      .eq("partie_id", id)
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("ordre")
      .order("created_at"),
    supabase.from("processus").select("id, nom").eq("tenant_id", tid).order("ordre_affichage"),
  ]);

  const processusList = processus ?? [];
  const processusNom = new Map(processusList.map((p) => [p.id, p.nom]));

  const total = scoreTotal(partie.pouvoir, partie.legitimite, partie.urgence);
  const priorite = prioriteFromTotal(total);
  const items = attentes ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <BackLink href="/strategie/parties-prenantes" label="Parties prenantes" />

      <PageHeader
        title={partie.nom}
        description={`${SPHERE_LABELS[partie.sphere] ?? partie.sphere} · interaction ${
          INTERACTION_LABELS[partie.niveau_interaction]?.toLowerCase() ?? ""
        }`}
      >
        <PartieDialog partie={partie} />
        <SupprimerButton
          action={deletePartieAction}
          id={partie.id}
          libelle={`la partie prenante « ${partie.nom} »`}
          successText="Partie prenante supprimée."
          redirectTo="/strategie/parties-prenantes"
        />
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cotation de saillance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-5">
          <Stat label="Pouvoir" value={partie.pouvoir} />
          <Stat label="Légitimité" value={partie.legitimite} />
          <Stat label="Urgence" value={partie.urgence} />
          <Stat label="Total" value={`${total} / 5,25`} />
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Priorité</span>
            <span
              className={`inline-flex w-fit rounded-full px-2 py-0.5 font-medium text-sm ${PRIORITE_CLASS[priorite]}`}
            >
              {PRIORITE_LABELS[priorite]}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-base">Attentes ({items.length})</h2>
        <AttenteDialog partieId={id} priorite={priorite} processus={processusList} />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Aucune attente enregistrée. Ajoutez les attentes de cette partie prenante et leurs
            risques/opportunités.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((a) => {
            const crit = criticiteResiduelle(priorite, a.maitrise);
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-4 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{a.attente}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <AttenteDialog
                        partieId={id}
                        priorite={priorite}
                        processus={processusList}
                        attente={a}
                      />
                      <AttenteDelete id={a.id} partieId={id} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Risque encouru
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{a.risque ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Opportunité
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{a.opportunite ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Moyens de maîtrise
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{a.moyens_maitrise ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Action
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{a.action ?? "-"}</p>
                    </div>
                    {a.commentaire ? (
                      <div className="sm:col-span-2">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Commentaire / recommandation
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap">{a.commentaire}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs">
                    <span className="text-muted-foreground">
                      Maîtrise :{" "}
                      <span className="text-foreground">{MAITRISE_LABELS[a.maitrise]}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Criticité résiduelle :{" "}
                      <span className={`font-medium ${criticiteClass(crit)}`}>{crit}</span>
                    </span>
                    {a.processus_id ? (
                      <span className="text-muted-foreground">
                        Processus :{" "}
                        <ProcessusLink
                          id={a.processus_id}
                          nom={processusNom.get(a.processus_id) ?? null}
                        />
                      </span>
                    ) : null}
                    {a.integration_pa ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                        <Check className="size-3" />À intégrer au plan d'actions
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
