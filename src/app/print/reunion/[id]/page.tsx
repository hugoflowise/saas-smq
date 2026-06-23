import { PrintShell, type Societe } from "@/components/print-shell";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const TYPE_LABELS: Record<string, string> = {
  comite_qhse: "Comité QHSE",
  reunion_echange: "Réunion d'échange",
  revue: "Revue",
  autre: "Autre",
};
const POINT_STATUT: Record<string, string> = {
  a_voir: "À voir",
  traite: "Traité",
  reporte: "Reporté",
};

type Point = {
  sujet?: string;
  discussion?: string;
  decision?: string;
  statut?: string;
};

export default async function ReunionPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return <p className="p-8 text-sm">Aucun client sélectionné.</p>;
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte",
    )
    .eq("id", tid)
    .maybeSingle();

  const { data: reunion } = await supabase
    .from("reunions")
    .select(
      "titre, type, date_prevue, date_realisation, lieu, animateur, objectifs, convoques, presents, synthese, statut, points",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!reunion) {
    return <p className="p-8 text-sm">Réunion introuvable.</p>;
  }

  const { data: links } = await supabase
    .from("reunion_actions")
    .select("action_id")
    .eq("reunion_id", id)
    .eq("tenant_id", tid);
  const actionIds = (links ?? []).map((l) => l.action_id);
  const { data: actions } = actionIds.length
    ? await supabase
        .from("actions")
        .select("reference, description_courte, statut")
        .in("id", actionIds)
    : { data: [] };

  const points = (reunion.points ?? []) as Point[];

  const meta = [
    { label: "Type", value: TYPE_LABELS[reunion.type] ?? reunion.type },
    {
      label: "Date",
      value: formatDate(reunion.date_realisation ?? reunion.date_prevue),
    },
    { label: "Lieu", value: reunion.lieu ?? "-" },
    { label: "Animateur", value: reunion.animateur ?? "-" },
    { label: "Statut", value: reunion.statut === "terminee" ? "Terminée" : "Planifiée" },
  ];

  return (
    <PrintShell
      backHref={`/reunions/${id}`}
      surtitre="Compte rendu de réunion"
      titre={reunion.titre}
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <div className="flex flex-col gap-6">
        {reunion.objectifs ? (
          <section>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">Objectifs</h2>
            <p className="whitespace-pre-wrap text-sm">{reunion.objectifs}</p>
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">Convoqués</h2>
            <p className="whitespace-pre-wrap text-sm">{reunion.convoques ?? "-"}</p>
          </div>
          <div>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">Présents</h2>
            <p className="whitespace-pre-wrap text-sm">{reunion.presents ?? "-"}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">Ordre du jour</h2>
          {points.length === 0 ? (
            <p className="text-sm">Aucun point.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {points.map((p, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: points ordonnés
                  key={i}
                  className="rounded-lg border border-[#0b1120]/10 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">
                      {i + 1}. {p.sujet}
                    </p>
                    <span className="rounded-full bg-[#0b1120]/[0.06] px-2 py-0.5 text-xs">
                      {POINT_STATUT[p.statut ?? "a_voir"] ?? p.statut}
                    </span>
                  </div>
                  {p.discussion ? (
                    <p className="text-sm">
                      <span className="text-[#0b1120]/50">Discussion : </span>
                      {p.discussion}
                    </p>
                  ) : null}
                  {p.decision ? (
                    <p className="text-sm">
                      <span className="text-[#0b1120]/50">Décision : </span>
                      {p.decision}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {(actions ?? []).length > 0 ? (
          <section>
            <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">Actions décidées</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {(actions ?? []).map((a) => (
                <li key={a.reference}>
                  <span className="font-mono text-xs">{a.reference}</span> · {a.description_courte}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {reunion.synthese ? (
          <section>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">Synthèse</h2>
            <p className="whitespace-pre-wrap text-sm">{reunion.synthese}</p>
          </section>
        ) : null}
      </div>
    </PrintShell>
  );
}
