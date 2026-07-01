import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BADGE_BASE } from "@/lib/badges";
import { TIMEZONE } from "@/lib/format";
import {
  AUDIT_ACTION_CLASS,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY,
  entityLabel,
  fieldLabel,
} from "@/lib/journal";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { JournalFilters } from "./journal-filters";

const LIMIT = 200;

function formatHorodatage(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

/** Représentation courte et lisible d'une valeur de diff (JSON). */
function formatValeur(v: unknown): string {
  if (v === null || v === undefined || v === "") return "∅";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.length > 80 ? `${v.slice(0, 80)}…` : v;
  return "(contenu structuré)";
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ entite?: string; action?: string }>;
}) {
  const ctx = await getTenantContext();
  const { entite, action } = await searchParams;

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Main courante"
          description="Journal horodaté de toutes les modifications du système {{domaine}}."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, created_at, user_id, action, entity_type, entity_id, entity_label, diff")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (entite) query = query.eq("entity_type", entite);
  if (action) query = query.eq("action", action);

  const { data: rawEntries } = await query;
  const entries = rawEntries ?? [];

  const userIds = [...new Set(entries.map((e) => e.user_id).filter(Boolean))] as string[];
  const { data: persons } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const nameById = new Map((persons ?? []).map((p) => [p.id, p.full_name ?? p.email]));

  return (
    <div className="w-full">
      <PageHeader
        title="Main courante"
        description="Journal horodaté des créations, modifications et suppressions du système {{domaine}}."
        isoClause="ISO 9001 §7.5"
        help="La main courante fournit une traçabilité consultable de l'activité documentaire : qui a fait quoi, quand, sur quel élément. C'est un appui pour la maîtrise des informations documentées et les audits."
      >
        <JournalFilters entity={entite ?? null} action={action ?? null} />
      </PageHeader>

      {entries.length === 0 ? (
        <EmptyState
          title="Aucune entrée"
          description="Les modifications réalisées dans les modules apparaîtront ici automatiquement."
        />
      ) : (
        <>
          <div className="rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Date</TableHead>
                  <TableHead className="w-40">Opération</TableHead>
                  <TableHead>Élément</TableHead>
                  <TableHead className="w-48">Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const href = AUDIT_ENTITY[e.entity_type]?.href ?? null;
                  const diff = (e.diff ?? null) as Record<
                    string,
                    { avant: unknown; apres: unknown }
                  > | null;
                  const champs = diff ? Object.keys(diff) : [];
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatHorodatage(e.created_at)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${BADGE_BASE} ${AUDIT_ACTION_CLASS[e.action] ?? "bg-muted"}`}
                        >
                          {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground text-xs">
                            {entityLabel(e.entity_type)}
                          </span>
                          <span className="font-medium">
                            {href ? (
                              <Link href={href} className="hover:text-primary hover:underline">
                                {e.entity_label ?? "(sans libellé)"}
                              </Link>
                            ) : (
                              (e.entity_label ?? "(sans libellé)")
                            )}
                          </span>
                          {champs.length > 0 ? (
                            <details className="mt-0.5 text-muted-foreground text-xs">
                              <summary className="cursor-pointer select-none">
                                {champs.length} champ{champs.length > 1 ? "s" : ""} modifié
                                {champs.length > 1 ? "s" : ""}
                              </summary>
                              <ul className="mt-1 space-y-0.5 border-border/60 border-l pl-3">
                                {champs.map((k) => (
                                  <li key={k}>
                                    <span className="capitalize">{fieldLabel(k)}</span> :{" "}
                                    <span className="line-through opacity-60">
                                      {formatValeur(diff?.[k]?.avant)}
                                    </span>{" "}
                                    →{" "}
                                    <span className="text-foreground">
                                      {formatValeur(diff?.[k]?.apres)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {e.user_id ? (nameById.get(e.user_id) ?? "Utilisateur") : "Système"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {entries.length === LIMIT ? (
            <p className="mt-3 text-muted-foreground text-xs">
              Affichage des {LIMIT} dernières entrées. Affinez avec les filtres pour remonter plus
              loin.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
