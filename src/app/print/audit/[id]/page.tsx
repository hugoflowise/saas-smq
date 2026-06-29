import { PrintShell, type Societe } from "@/components/print-shell";
import { formatDate, nomPersonne, todayISO } from "@/lib/format";
import {
  ACTION_STATUT_LABELS,
  AUDIT_STATUT_LABELS,
  AUDIT_TYPE_LABELS,
  COTATION_LABELS,
} from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

export default async function AuditPrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: audit } = await supabase
    .from("audits_internes")
    .select(
      "id, reference, type_audit, organisme, perimetre, processus_audites, auditeur_id, date_prevue, date_realisee, duree_prevue, statut, rapport, ecarts_constates",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!audit) {
    return <p className="p-8 text-sm">Audit introuvable.</p>;
  }

  // Auditeur (impartialité §9.2.2) : nom lisible.
  let auditeurNom: string | null = null;
  if (audit.auditeur_id) {
    const { data: auditeur } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", audit.auditeur_id)
      .maybeSingle();
    if (auditeur) auditeurNom = nomPersonne(auditeur.full_name, auditeur.email);
  }

  // Processus audités : noms ordonnés selon la cartographie.
  const processusIds = audit.processus_audites ?? [];
  const { data: processus } = processusIds.length
    ? await supabase
        .from("processus")
        .select("id, nom")
        .eq("tenant_id", tid)
        .in("id", processusIds)
        .order("ordre_affichage", { ascending: true })
    : { data: [] };
  const processusNoms = (processus ?? []).map((p) => p.nom);

  const { data: questions } = await supabase
    .from("audit_questions")
    .select("id, reference_iso, question, reponse, constat")
    .eq("audit_id", id)
    .eq("tenant_id", tid)
    .order("ordre", { ascending: true });

  const { data: links } = await supabase
    .from("audit_actions")
    .select("action_id")
    .eq("audit_id", id)
    .eq("tenant_id", tid);
  const actionIds = (links ?? []).map((l) => l.action_id);
  const { data: linkedActions } = actionIds.length
    ? await supabase
        .from("actions")
        .select("reference, description_courte, statut")
        .in("id", actionIds)
        .is("deleted_at", null)
    : { data: [] };

  const meta = [
    {
      label: "Type",
      value:
        AUDIT_TYPE_LABELS[audit.type_audit as keyof typeof AUDIT_TYPE_LABELS] ?? audit.type_audit,
    },
    { label: "Auditeur", value: auditeurNom ?? "Non désigné" },
    {
      label: "Statut",
      value: AUDIT_STATUT_LABELS[audit.statut as keyof typeof AUDIT_STATUT_LABELS] ?? audit.statut,
    },
    { label: "Date prévue", value: audit.date_prevue ? formatDate(audit.date_prevue) : "-" },
    { label: "Date réalisée", value: audit.date_realisee ? formatDate(audit.date_realisee) : "-" },
  ];

  return (
    <PrintShell
      backHref={`/audits/${id}`}
      surtitre="Rapport d'audit interne · ISO 9001 §9.2"
      titre={`Audit ${audit.reference}`}
      societe={tenant as Societe}
      meta={meta}
      genereLe={formatDate(todayISO())}
    >
      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">
            Périmètre & critères
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            {audit.organisme ? (
              <p>
                <span className="font-semibold">Organisme : </span>
                {audit.organisme}
              </p>
            ) : null}
            <p>
              <span className="font-semibold">Processus audités : </span>
              {processusNoms.length ? processusNoms.join(", ") : "-"}
            </p>
            {audit.perimetre ? (
              <p>
                <span className="font-semibold">Précision périmètre : </span>
                {audit.perimetre}
              </p>
            ) : null}
            <p>
              <span className="font-semibold">Critères d'audit : </span>
              référentiel ISO 9001:2015, documentation du SMQ et exigences applicables.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">
            Grille d'audit (constats & cotation)
          </h2>
          {(questions ?? []).length === 0 ? (
            <p className="text-[#0b1120]/50 text-sm">Aucun point de contrôle renseigné.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-[#0b1120]/15 border-b text-left">
                  <th className="w-16 py-1 pr-2 font-semibold">Réf. ISO</th>
                  <th className="py-1 pr-2 font-semibold">Point de contrôle / constat</th>
                  <th className="w-28 py-1 font-semibold">Cotation</th>
                </tr>
              </thead>
              <tbody>
                {(questions ?? []).map((q) => (
                  <tr key={q.id} className="border-[#0b1120]/10 border-b align-top">
                    <td className="py-1.5 pr-2 font-mono text-[#0b1120]/60 text-xs">
                      {q.reference_iso ?? "-"}
                    </td>
                    <td className="py-1.5 pr-2">
                      <p className="font-medium">{q.question}</p>
                      {q.constat ? (
                        <p className="mt-0.5 whitespace-pre-wrap text-[#0b1120]/70">{q.constat}</p>
                      ) : null}
                    </td>
                    <td className="py-1.5">
                      {COTATION_LABELS[q.reponse as keyof typeof COTATION_LABELS] ?? q.reponse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {audit.ecarts_constates ? (
          <section>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">Écarts constatés</h2>
            <p className="whitespace-pre-wrap text-sm">{audit.ecarts_constates}</p>
          </section>
        ) : null}

        {(linkedActions ?? []).length > 0 ? (
          <section>
            <h2 className="mb-2 font-semibold text-sm uppercase tracking-wide">
              Actions correctives associées
            </h2>
            <ul className="flex flex-col gap-1 text-sm">
              {(linkedActions ?? []).map((a) => (
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

        {audit.rapport ? (
          <section>
            <h2 className="mb-1 font-semibold text-sm uppercase tracking-wide">
              Conclusion / rapport
            </h2>
            <p className="whitespace-pre-wrap text-sm">{audit.rapport}</p>
          </section>
        ) : null}
      </div>
    </PrintShell>
  );
}
