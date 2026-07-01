import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { resoudreDefinitionFormulaire } from "@/lib/formulaire-modeles";
import type { Champ } from "@/lib/suivi-consultant";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

function val(c: Champ, r: Record<string, unknown>): string {
  const v = r[c.key];
  if (c.type === "multi") {
    const base = Array.isArray(v) ? v.map(String) : [];
    const autre = r[`${c.key}_autre`];
    if (typeof autre === "string" && autre.trim()) base.push(`Autre : ${autre}`);
    return base.length ? base.join(", ") : "-";
  }
  if (c.type === "date") {
    return typeof v === "string" && v ? formatDate(v) : "-";
  }
  if (v == null || v === "") return "-";
  return String(v);
}

function visible(c: Champ, r: Record<string, unknown>): boolean {
  return !c.showIf || r[c.showIf.key] === c.showIf.equals;
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

  const { sections } = await resoudreDefinitionFormulaire(
    supabase,
    ctx.effectiveTenantId,
    "suivi_prestation",
  );

  const r = (suivi.reponses ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/suivi-prestation" label="Suivis de prestation" />

      <PageHeader
        title={`Suivi · ${suivi.client ?? "-"}`}
        description={`${suivi.consultant ?? ""} · ${formatDate(suivi.date_suivi)}`}
      />

      {suivi.est_reclamation ? (
        <div className="mb-6 rounded-lg border border-status-nc-mineure/30 bg-status-nc-mineure/10 px-4 py-3 text-sm text-status-nc-mineure">
          ⚠ Réclamation : satisfaction ou recommandation basse.
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {sections.map((section) => {
          const champs = section.champs.filter((c) => visible(c, r));
          if (champs.length === 0) return null;
          return (
            <Card key={section.n}>
              <CardHeader>
                <CardTitle className="text-base">
                  {section.n}. {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {champs.map((c) =>
                  c.type === "matrice" ? (
                    <div key={c.key} className="flex flex-col gap-2 sm:col-span-2">
                      {(c.lignes ?? []).map((ligne) => {
                        const m = (r[c.key] ?? {}) as Record<string, unknown>;
                        return (
                          <Field
                            key={ligne.key}
                            label={ligne.label}
                            value={m[ligne.key] == null ? "-" : String(m[ligne.key])}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      key={c.key}
                      className={`flex flex-col gap-1 ${c.type === "textarea" ? "sm:col-span-2" : ""}`}
                    >
                      <span className="text-muted-foreground text-xs uppercase tracking-wide">
                        {c.label}
                      </span>
                      <span className="whitespace-pre-wrap text-sm">{val(c, r)}</span>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
