import "server-only";
import { AUDIT_TYPE_LABELS } from "./labels";

const ACTIONS_ACTIVES = ["a_faire", "en_cours", "bloquee"] as const;

/** Une échéance à venir, tous modules confondus. */
export type Echeance = { date: string; label: string; href: string };

/** Un document dont la révision est dépassée ou imminente. */
export type DocAReviser = { id: string; code: string | null; titre: string; date: string };

/** Une action en retard (date prévue dépassée, action non soldée). */
export type ActionRetard = { id: string; reference: string | null; label: string; date: string };

export type EcheancesTenant = {
  echeances: Echeance[];
  docsAReviser: DocAReviser[];
  actionsRetard: ActionRetard[];
};

/** Vrai si le tenant a au moins une chose à signaler (utile pour ne pas envoyer de digest vide). */
export function aDesAlertes(e: EcheancesTenant): boolean {
  return e.echeances.length > 0 || e.docsAReviser.length > 0 || e.actionsRetard.length > 0;
}

/**
 * Rassemble, pour un tenant, les échéances à venir (sur `jours` jours), les
 * documents à réviser (dépassés ou imminents) et les actions en retard.
 *
 * C'est la même agrégation que le cockpit du tableau de bord, isolée ici pour
 * être réutilisable (notamment par le digest e-mail quotidien). Accepte aussi
 * bien le client serveur (session) que le client admin (service_role).
 */
export async function collectEcheances(
  // biome-ignore lint/suspicious/noExplicitAny: client Supabase serveur ou admin (même API).
  supabase: any,
  tenantId: string,
  jours = 30,
): Promise<EcheancesTenant> {
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + jours * 86_400_000).toISOString().slice(0, 10);

  const [
    docs,
    actionsLate,
    auditsAvenir,
    revuesAvenir,
    roAvenir,
    actionsAvenir,
    reunionsAvenir,
    jalonsAvenir,
  ] = await Promise.all([
    supabase
      .from("documents_maitrise")
      .select("id, code, titre, date_revision_prevue")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .not("date_revision_prevue", "is", null)
      .lte("date_revision_prevue", horizon)
      .order("date_revision_prevue", { ascending: true }),
    supabase
      .from("actions")
      .select("id, reference, description_courte, date_prevue")
      .eq("tenant_id", tenantId)
      .in("statut", ACTIONS_ACTIVES)
      .lt("date_prevue", today)
      .order("date_prevue", { ascending: true }),
    supabase
      .from("audits_internes")
      .select("id, reference, type_audit, perimetre, organisme, date_prevue")
      .eq("tenant_id", tenantId)
      .neq("statut", "cloture")
      .gte("date_prevue", today)
      .lte("date_prevue", horizon),
    supabase
      .from("revues_direction")
      .select("id, annee, date_realisation")
      .eq("tenant_id", tenantId)
      .neq("statut", "cloturee")
      .gte("date_realisation", today)
      .lte("date_realisation", horizon),
    supabase
      .from("risques_opportunites")
      .select("id, intitule, date_revue")
      .eq("tenant_id", tenantId)
      .neq("statut", "cloture")
      .gte("date_revue", today)
      .lte("date_revue", horizon),
    supabase
      .from("actions")
      .select("id, reference, description_courte, date_prevue")
      .eq("tenant_id", tenantId)
      .in("statut", ACTIONS_ACTIVES)
      .gte("date_prevue", today)
      .lte("date_prevue", horizon),
    supabase
      .from("reunions")
      .select("id, titre, date_prevue")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("statut", "terminee")
      .gte("date_prevue", today)
      .lte("date_prevue", horizon),
    supabase
      .from("jalons_certification")
      .select("id, libelle, date_jalon")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("statut", "realise")
      .gte("date_jalon", today)
      .lte("date_jalon", horizon),
  ]);

  const echeances: Echeance[] = [];
  for (const a of auditsAvenir.data ?? []) {
    const t =
      AUDIT_TYPE_LABELS[a.type_audit as keyof typeof AUDIT_TYPE_LABELS]?.toLowerCase() ?? "";
    echeances.push({
      date: a.date_prevue as string,
      label: `Audit ${t} · ${a.perimetre ?? a.organisme ?? a.reference}`,
      href: `/audits/${a.id}`,
    });
  }
  for (const r of revuesAvenir.data ?? []) {
    echeances.push({
      date: r.date_realisation as string,
      label: `Revue de direction ${r.annee}`,
      href: "/revues/direction",
    });
  }
  for (const r of roAvenir.data ?? []) {
    echeances.push({
      date: r.date_revue as string,
      label: `Revue R&O · ${r.intitule}`,
      href: `/risques/${r.id}`,
    });
  }
  for (const a of actionsAvenir.data ?? []) {
    echeances.push({
      date: a.date_prevue as string,
      label: `Action · ${a.description_courte}`,
      href: `/actions/${a.id}`,
    });
  }
  for (const r of reunionsAvenir.data ?? []) {
    echeances.push({
      date: r.date_prevue as string,
      label: `Réunion QHSE · ${r.titre}`,
      href: `/reunions/${r.id}`,
    });
  }
  for (const j of jalonsAvenir.data ?? []) {
    echeances.push({
      date: j.date_jalon as string,
      label: `Certification · ${j.libelle}`,
      href: "/certification",
    });
  }
  echeances.sort((a, b) => a.date.localeCompare(b.date));

  const docsAReviser: DocAReviser[] = (docs.data ?? []).map(
    (d: { id: string; code: string | null; titre: string; date_revision_prevue: string }) => ({
      id: d.id,
      code: d.code,
      titre: d.titre,
      date: d.date_revision_prevue,
    }),
  );

  const actionsRetard: ActionRetard[] = (actionsLate.data ?? []).map(
    (a: {
      id: string;
      reference: string | null;
      description_courte: string;
      date_prevue: string;
    }) => ({
      id: a.id,
      reference: a.reference,
      label: a.description_courte,
      date: a.date_prevue,
    }),
  );

  return { echeances, docsAReviser, actionsRetard };
}
