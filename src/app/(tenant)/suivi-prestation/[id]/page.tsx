import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { QSSE_FIELDS, SATISFACTION_AXES } from "@/lib/suivi-prestation";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

function val(v: unknown): string {
  if (v == null || v === "") return "-";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  return String(v);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
      <span className="whitespace-pre-wrap text-sm">{value}</span>
    </div>
  );
}

export default async function SuiviDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/suivi-prestation");

  const supabase = await createClient();
  const { data: suivi } = await supabase
    .from("suivis_prestation")
    .select("id, client, consultant, date_suivi, est_reclamation, reponses")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (!suivi) notFound();

  const r = (suivi.reponses ?? {}) as Record<string, unknown>;
  const autre = (arr: unknown, autreVal: unknown) => {
    const base = Array.isArray(arr) ? [...arr] : [];
    if (typeof autreVal === "string" && autreVal.trim()) base.push(`Autre : ${autreVal}`);
    return base.length ? base.join(", ") : "-";
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/suivi-prestation" label="Suivis de prestation" />

      <PageHeader
        title={`Suivi · ${suivi.client ?? "-"}`}
        description={`${suivi.consultant ?? ""} · ${formatDate(suivi.date_suivi)}`}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Contexte de la visite</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Consultant" value={val(r.consultant)} />
            <Field label="Client / entité" value={val(r.client)} />
            <Field label="Mission / poste" value={val(r.mission)} />
            <Field label="Date du suivi" value={formatDate(suivi.date_suivi)} />
            <Field label="Manager" value={val(r.manager)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Activité et périmètre</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5">
            <Field label="Réalisations passées" value={val(r.realisations_passees)} />
            <Field label="Réalisations à venir" value={val(r.realisations_a_venir)} />
            <Field label="Périmètre évolué ?" value={val(r.perimetre_evolue)} />
            {r.perimetre_evolue === "Oui" ? (
              <Field label="Écarts" value={val(r.ecarts_details)} />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Satisfaction sur la prestation (1 à 4)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {SATISFACTION_AXES.map((axe) => {
              const axes = (r.satisfaction_axes ?? {}) as Record<string, unknown>;
              return <Field key={axe.key} label={axe.label} value={val(axes[axe.key])} />;
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Bilan qualitatif</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5">
            <Field label="Points forts" value={autre(r.points_forts, r.points_forts_autre)} />
            <Field
              label="Axes d'amélioration"
              value={autre(r.axes_amelioration, r.axes_amelioration_autre)}
            />
            <Field label="Commentaire" value={val(r.commentaire_bilan)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Sécurité (QSSE)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {QSSE_FIELDS.map((q) => (
              <Field key={q.key} label={q.label} value={val(r[q.key])} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6. Satisfaction globale et recommandation</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Satisfaction globale (/5)" value={val(r.satisfaction_globale)} />
            <Field label="Recommandation (NPS 0-10)" value={val(r.nps)} />
            <div className="sm:col-span-2">
              <Field label="Commentaire" value={val(r.commentaire_satisfaction)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">7. Développement et suite</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5">
            <Field label="Futurs besoins" value={autre(r.besoins_futurs, r.besoins_futurs_autre)} />
            <Field label="Améliorations proposées" value={val(r.amelioration_prestations)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">8. Plan d'actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Actions à prévoir"
                value={autre(r.plan_actions, r.plan_actions_autre)}
              />
            </div>
            <Field label="Délais de réalisation" value={val(r.delais_actions)} />
            <Field
              label="Nouvelle date de suivi"
              value={formatDate(
                typeof r.nouvelle_date_suivi === "string" ? r.nouvelle_date_suivi : null,
              )}
            />
            <div className="sm:col-span-2">
              <Field label="Commentaire" value={val(r.commentaire_plan)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">9. Validation</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Représentant client" value={val(r.nom_representant)} />
            <Field label="E-mail représentant" value={val(r.mail_representant)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
