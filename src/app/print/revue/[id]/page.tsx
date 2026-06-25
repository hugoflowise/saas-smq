import { PrintShell, type Societe } from "@/components/print-shell";
import { formatDate, todayISO } from "@/lib/format";
import { ACTION_STATUT_LABELS } from "@/lib/labels";
import { computeRevuePerformance, type RevuePerformance, revuePerfCells } from "@/lib/revue-perf";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const STATUT_LABELS: Record<string, string> = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  cloturee: "Clôturée",
};

type Participant = { nom?: string; fonction?: string };

export default async function RevuePrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: revue } = await supabase
    .from("revues_direction")
    .select(
      "id, annee, date_realisation, statut, donnees_performance, donnees_capturees_le, participants, points_specifiques, entree_actions_anterieures, entree_evolution_contexte, entree_performance_synthese, entree_ressources, entree_efficacite_actions, entree_opportunites, sortie_amelioration, sortie_changements, sortie_ressources",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!revue) {
    return <p className="p-8 text-sm">Revue introuvable.</p>;
  }

  const snapshot = revue.donnees_performance as RevuePerformance | null;
  const perf = snapshot ?? (await computeRevuePerformance(supabase, tid, revue.annee));
  const participants = (revue.participants as Participant[]) ?? [];

  const { data: actions } = await supabase
    .from("actions")
    .select("reference, description_courte, statut")
    .eq("tenant_id", tid)
    .eq("revue_id", id)
    .is("deleted_at", null)
    .order("date_creation", { ascending: false });

  const entrees: { label: string; value: string | null }[] = [
    {
      label: "a) Suivi des actions des revues précédentes",
      value: revue.entree_actions_anterieures,
    },
    {
      label: "b) Évolutions des enjeux internes et externes",
      value: revue.entree_evolution_contexte,
    },
    { label: "c) Synthèse de la performance du SMQ", value: revue.entree_performance_synthese },
    { label: "d) Adéquation des ressources", value: revue.entree_ressources },
    {
      label: "e) Efficacité des actions face aux risques et opportunités",
      value: revue.entree_efficacite_actions,
    },
    { label: "f) Opportunités d'amélioration", value: revue.entree_opportunites },
  ];
  const sorties: { label: string; value: string | null }[] = [
    { label: "Décisions et actions d'amélioration", value: revue.sortie_amelioration },
    { label: "Besoins de changement du SMQ", value: revue.sortie_changements },
    { label: "Besoins en ressources", value: revue.sortie_ressources },
  ];

  const meta = [
    { label: "Année", value: String(revue.annee) },
    { label: "Date", value: revue.date_realisation ? formatDate(revue.date_realisation) : "-" },
    { label: "Statut", value: STATUT_LABELS[revue.statut] ?? revue.statut },
  ];

  return (
    <PrintShell
      backHref={`/revues/direction/${id}`}
      surtitre="Revue de direction"
      titre={`Revue de direction ${revue.annee}`}
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <div className="flex flex-col gap-6">
        {participants.length > 0 ? (
          <section>
            <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">Participants</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {participants.map((p, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: liste figée pour impression
                <li key={i}>
                  <span className="font-semibold">{p.nom}</span>
                  {p.fonction ? ` — ${p.fonction}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">
            Performance du SMQ (§9.3.2 c)
            {revue.donnees_capturees_le ? ` — au ${formatDate(revue.donnees_capturees_le)}` : ""}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {revuePerfCells(perf).map((c) => (
              <div key={c.label} className="rounded-lg border border-[#0b1120]/10 px-3 py-2">
                <p className="font-semibold text-base">{c.value}</p>
                <p className="text-[#0b1120]/50 text-xs">{c.label}</p>
              </div>
            ))}
          </div>
        </section>

        <Bloc titre="Éléments d'entrée (§9.3.2)" lignes={entrees} />
        <Bloc titre="Éléments de sortie (§9.3.3)" lignes={sorties} />

        {(actions ?? []).length > 0 ? (
          <section>
            <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">
              Actions décidées (§9.3.3)
            </h2>
            <ul className="flex flex-col gap-1 text-sm">
              {(actions ?? []).map((a) => (
                <li key={a.reference}>
                  <span className="font-mono text-xs">{a.reference}</span> · {a.description_courte}{" "}
                  <span className="text-[#0b1120]/50">
                    (
                    {ACTION_STATUT_LABELS[a.statut as keyof typeof ACTION_STATUT_LABELS] ??
                      a.statut}
                    )
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {revue.points_specifiques ? (
          <section>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">
              Points spécifiques
            </h2>
            <p className="whitespace-pre-wrap text-sm">{revue.points_specifiques}</p>
          </section>
        ) : null}
      </div>
    </PrintShell>
  );
}

function Bloc({
  titre,
  lignes,
}: {
  titre: string;
  lignes: { label: string; value: string | null }[];
}) {
  return (
    <section>
      <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">{titre}</h2>
      <div className="flex flex-col gap-3">
        {lignes.map((l) => (
          <div key={l.label}>
            <p className="font-semibold text-sm">{l.label}</p>
            <p className="whitespace-pre-wrap text-sm">{l.value || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
