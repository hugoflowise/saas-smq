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

export default async function SuiviConsultantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/suivi-consultant");

  const supabase = await createClient();
  const { data: suivi } = await supabase
    .from("suivis_consultant")
    .select("id, nom, client, alerte, created_at, reponses")
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .maybeSingle();
  if (!suivi) notFound();

  const { sections } = await resoudreDefinitionFormulaire(
    supabase,
    ctx.effectiveTenantId,
    "suivi_consultant",
  );

  const r = (suivi.reponses ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/suivi-consultant" label="Suivi consultant" />

      <PageHeader
        title={`Suivi · ${suivi.nom ?? "-"}`}
        description={`${suivi.client ?? ""} · ${formatDate(suivi.created_at.slice(0, 10))}`}
      />

      {suivi.alerte ? (
        <div className="mb-6 rounded-lg border border-status-nc-majeure/30 bg-status-nc-majeure/10 px-4 py-3 text-sm text-status-nc-majeure">
          ⚠ Alerte santé / RPS signalée (relation conflictuelle, harcèlement ou stress à
          répétition).
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
                {champs.map((c) => (
                  <div
                    key={c.key}
                    className={`flex flex-col gap-1 ${c.type === "textarea" ? "sm:col-span-2" : ""}`}
                  >
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      {c.label}
                    </span>
                    <span className="whitespace-pre-wrap text-sm">{val(c, r)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
