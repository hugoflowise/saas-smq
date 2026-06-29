import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";
import { InfosSocieteForm } from "./infos-societe-form";
import { LogoForm } from "./logo-form";

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
      "logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, liste_diffusion, couleur_charte, boond_account_id, boond_sync_status",
    )
    .eq("id", ctx.effectiveTenantId)
    .maybeSingle();

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Paramètres" description="Configuration du client." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo de la société</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoForm logoUrl={tenant?.logo_url ?? null} />
        </CardContent>
      </Card>

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

      {/*
        Intégration Boond — section DÉSACTIVÉE (préparation).
        Aucune action réseau : on affiche seulement l'état de connexion lu en base
        (boond_account_id / boond_sync_status). Le bouton « Connecter » est inactif
        tant que le partenariat technique n'est pas en place.
        Voir docs/integration-boond.md.
      */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intégration Boond</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Connectez votre compte Boond pour alimenter automatiquement l'effectif, les indicateurs
            et la revue d'engagement. Chaque client reste isolé sur son propre compte.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Statut :</span>
            <span className="font-medium">
              {tenant?.boond_account_id
                ? "Compte renseigné"
                : tenant?.boond_sync_status === "erreur"
                  ? "Erreur de synchronisation"
                  : "Non connecté"}
            </span>
          </div>
          <div>
            <Button type="button" disabled>
              Connecter Boond
            </Button>
            <p className="mt-1 text-muted-foreground text-xs">Disponible prochainement.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
