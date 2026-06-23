import { headers } from "next/headers";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";
import { CopyField } from "./copy-field";
import { InfosSocieteForm } from "./infos-societe-form";

export default async function ParametresPage() {
  const ctx = await getTenantContext();
  const canSee = ctx.role === "admin_flowise" || ctx.role === "dirigeant";

  if (!ctx.effectiveTenantId || !canSee) {
    return (
      <div className="w-full">
        <PageHeader title="Paramètres" description="Configuration du client." />
        <EmptyState
          title={ctx.effectiveTenantId ? "Accès réservé" : "Aucun client sélectionné"}
          description={
            ctx.effectiveTenantId
              ? "Seul un dirigeant peut accéder aux paramètres."
              : "Choisissez un client dans le sélecteur en haut."
          }
        />
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select(
      "ingest_token, survey_token, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, liste_diffusion, couleur_charte",
    )
    .eq("id", ctx.effectiveTenantId)
    .maybeSingle();

  const h = await headers();
  const host = h.get("host") ?? "app.flowise.fr";
  const proto = host.includes("localhost") ? "http" : "https";
  const endpoint = `${proto}://${host}/api/ingest/satisfaction`;
  const surveyUrl = `${proto}://${host}/enquete/${tenant?.survey_token ?? ""}`;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Paramètres" description="Configuration du client." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations société</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Ces informations apparaissent en pied de page des documents PDF officiels (politique,
            procédures, comptes rendus…).
          </p>
          <InfosSocieteForm
            infos={{
              forme_juridique: tenant?.forme_juridique ?? null,
              siret: tenant?.siret ?? null,
              adresse: tenant?.adresse ?? null,
              code_postal: tenant?.code_postal ?? null,
              ville: tenant?.ville ?? null,
              mentions_legales: tenant?.mentions_legales ?? null,
              liste_diffusion: tenant?.liste_diffusion ?? null,
              couleur_charte: tenant?.couleur_charte ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Questionnaire de satisfaction</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Partagez ce lien à vos clients (e-mail, signature, QR code…). Chaque réponse alimente
            automatiquement le module Satisfaction, en temps réel · sans aucune licence.
          </p>
          <CopyField label="Lien public du questionnaire" value={surveyUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingestion Microsoft Forms (webhook)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Branchez un flux <strong>Power Automate</strong> sur votre formulaire Microsoft Forms
            pour envoyer chaque réponse automatiquement vers le module Satisfaction.
          </p>

          <CopyField label="URL du webhook (HTTP POST)" value={endpoint} />
          <CopyField
            label="Jeton secret (en-tête x-ingest-token)"
            value={tenant?.ingest_token ?? "-"}
          />

          <div className="rounded-lg border bg-surface p-3 text-muted-foreground text-sm">
            <p className="mb-2 font-medium text-foreground">Étapes dans Power Automate :</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Déclencheur « Microsoft Forms · Quand une nouvelle réponse est envoyée ».</li>
              <li>Action « Obtenir les détails de la réponse ».</li>
              <li>
                Action « HTTP » : méthode <code>POST</code>, URI = l'URL ci-dessus, en-tête{" "}
                <code>x-ingest-token</code> = le jeton, en-tête <code>Content-Type</code> ={" "}
                <code>application/json</code>.
              </li>
              <li>
                Corps JSON, ex. :{" "}
                <code>
                  {
                    '{ "client": "...", "noteRecommandation": 9, "noteSatisfaction": 8, "commentaire": "...", "source": "Microsoft Forms" }'
                  }
                </code>{" "}
                (mappez chaque champ sur une réponse du formulaire).
              </li>
            </ol>
            <p className="mt-2">
              Gardez ce jeton secret. Champs acceptés : <code>client</code>,{" "}
              <code>dateReponse</code>, <code>noteRecommandation</code> (0-10),{" "}
              <code>noteSatisfaction</code> (0-10), <code>commentaire</code>,{" "}
              <code>estReclamation</code>, <code>source</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
