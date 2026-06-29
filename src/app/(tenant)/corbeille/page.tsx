import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatTiles } from "@/components/stat-tiles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CORBEILLE_CONFIG, type CorbeilleRawRow } from "@/lib/corbeille";
import { formatDateTime } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";
import { RestaurerButton } from "./restaurer-button";

/** Un groupe d'éléments en corbeille (une catégorie / table). */
type Groupe = {
  table: string;
  label: string;
  elements: {
    id: string;
    intitule: string;
    reference: string | null;
    deletedAt: string | null;
  }[];
};

export default async function CorbeillePage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Corbeille"
          description="Éléments supprimés, restaurables à tout moment."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  // Lecture via le client service-role : les policies SELECT filtrent
  // `deleted_at is null`, donc les éléments en corbeille sont invisibles au
  // client utilisateur. Le périmètre tenant est imposé manuellement ci-dessous.
  const admin = createAdminClient();
  const tid = ctx.effectiveTenantId;

  const resultats = await Promise.all(
    CORBEILLE_CONFIG.map(async (cfg) => {
      const select = ["id", "deleted_at", ...cfg.columns].join(", ");
      const { data } = await admin
        .from(cfg.table)
        .select(select)
        .eq("tenant_id", tid)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      const rows = (data ?? []) as unknown as CorbeilleRawRow[];
      return {
        table: cfg.table,
        label: cfg.label,
        elements: rows.map((r) => ({
          id: r.id,
          intitule: cfg.intitule(r),
          reference: cfg.reference?.(r) ?? null,
          deletedAt: r.deleted_at,
        })),
      } satisfies Groupe;
    }),
  );

  const groupes = resultats.filter((g) => g.elements.length > 0);
  const total = groupes.reduce((n, g) => n + g.elements.length, 0);

  const tiles = [
    { label: "Éléments en corbeille", value: total, cls: "text-foreground" },
    { label: "Catégories concernées", value: groupes.length, cls: "text-muted-foreground" },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Corbeille"
        description="Éléments supprimés (mis en corbeille). Restaurez-les pour les faire réapparaître dans leur module."
        isoClause="ISO 9001 §7.5"
        help="La suppression dans l'application est réversible : rien n'est effacé définitivement. Cette page permet de retrouver et restaurer un document, un enregistrement ou tout autre élément métier mis en corbeille — utile pour préserver vos preuves d'audit."
      />

      {total === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Corbeille vide"
          description="Aucun élément supprimé. Les éléments mis à la corbeille apparaîtront ici, prêts à être restaurés."
        />
      ) : (
        <>
          <StatTiles tiles={tiles} className="mb-6" />

          <div className="flex flex-col gap-8">
            {groupes.map((g) => (
              <section key={g.table}>
                <h2 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {g.label}{" "}
                  <span className="font-normal text-muted-foreground/70">
                    ({g.elements.length})
                  </span>
                </h2>
                <div className="rounded-2xl border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28 whitespace-normal">Référence</TableHead>
                        <TableHead className="min-w-[200px]">Élément</TableHead>
                        <TableHead className="w-44">Supprimé le</TableHead>
                        <TableHead className="w-32 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.elements.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="whitespace-normal break-words font-medium text-muted-foreground text-sm">
                            {e.reference ?? "-"}
                          </TableCell>
                          <TableCell className="whitespace-normal font-medium">
                            {e.intitule}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(e.deletedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <RestaurerButton table={g.table} id={e.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
