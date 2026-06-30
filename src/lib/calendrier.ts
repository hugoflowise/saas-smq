import type { CalEvent } from "@/app/(tenant)/calendrier/calendrier-client";
import { AUDIT_TYPE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

/**
 * Agrège toutes les échéances qualité d'un tenant en événements de calendrier
 * (audits, revues, actions, R&O, communications, certification, réunions,
 * révisions de documents, événements manuels). Source unique partagée par la
 * page Calendrier et l'aperçu du tableau de bord.
 */
export async function loadCalendarEvents(tid: string): Promise<CalEvent[]> {
  const supabase = await createClient();

  const [audits, revues, actions, ros, communications, jalons, reunions, documents, evenements] =
    await Promise.all([
      supabase
        .from("audits_internes")
        .select("id, reference, type_audit, perimetre, organisme, date_prevue")
        .eq("tenant_id", tid)
        .not("date_prevue", "is", null),
      supabase
        .from("revues_direction")
        .select("id, annee, date_realisation")
        .eq("tenant_id", tid)
        .not("date_realisation", "is", null),
      supabase
        .from("actions")
        .select("id, reference, description_courte, date_prevue")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .in("statut", ["a_faire", "en_cours", "bloquee"] as ("a_faire" | "en_cours" | "bloquee")[])
        .not("date_prevue", "is", null),
      supabase
        .from("risques_opportunites")
        .select("id, intitule, date_revue")
        .eq("tenant_id", tid)
        .not("date_revue", "is", null),
      supabase
        .from("communications")
        .select("id, sujet, date_prevue")
        .eq("tenant_id", tid)
        .not("date_prevue", "is", null),
      supabase
        .from("jalons_certification")
        .select("id, libelle, date_jalon")
        .eq("tenant_id", tid)
        .not("date_jalon", "is", null),
      supabase
        .from("reunions")
        .select("id, titre, date_prevue")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .not("date_prevue", "is", null),
      supabase
        .from("documents_maitrise")
        .select("id, code, titre, date_revision_prevue")
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .not("date_revision_prevue", "is", null),
      supabase.from("evenements_qualite").select("id, titre, date_evenement").eq("tenant_id", tid),
    ]);

  const events: CalEvent[] = [];
  for (const a of audits.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `Audit ${AUDIT_TYPE_LABELS[a.type_audit as keyof typeof AUDIT_TYPE_LABELS]?.toLowerCase() ?? ""} · ${a.perimetre ?? a.organisme ?? a.reference}`,
      type: "Audit",
      href: `/audits/${a.id}`,
    });
  }
  for (const r of revues.data ?? []) {
    events.push({
      date: r.date_realisation as string,
      label: `Revue de direction ${r.annee}`,
      type: "Revue",
      href: "/revues/direction",
    });
  }
  for (const a of actions.data ?? []) {
    events.push({
      date: a.date_prevue as string,
      label: `${a.reference} · ${a.description_courte}`,
      type: "Action",
      href: `/actions/${a.id}`,
    });
  }
  for (const r of ros.data ?? []) {
    events.push({
      date: r.date_revue as string,
      label: `Revue R&O · ${r.intitule}`,
      type: "R&O",
      href: "/risques",
    });
  }
  for (const c of communications.data ?? []) {
    events.push({
      date: c.date_prevue as string,
      label: c.sujet,
      type: "Communication",
      href: "/communications",
    });
  }
  for (const j of jalons.data ?? []) {
    events.push({
      date: j.date_jalon as string,
      label: j.libelle,
      type: "Certification",
      href: "/calendrier",
    });
  }
  for (const r of reunions.data ?? []) {
    events.push({
      date: r.date_prevue as string,
      label: r.titre,
      type: "Réunion",
      href: `/reunions/${r.id}`,
    });
  }
  for (const d of documents.data ?? []) {
    events.push({
      date: d.date_revision_prevue as string,
      label: `Révision · ${d.code ? `${d.code} ` : ""}${d.titre}`,
      type: "Document",
      href: "/documents",
    });
  }
  for (const e of evenements.data ?? []) {
    events.push({
      date: e.date_evenement,
      label: e.titre,
      type: "Événement",
      href: "/calendrier",
    });
  }

  return events;
}
