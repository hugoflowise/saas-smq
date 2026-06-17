import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CreateProcessusDialog } from "./create-processus-dialog";

const COLUMNS = [
  { type: "pilotage" as const, label: "Pilotage" },
  { type: "realisation" as const, label: "Réalisation" },
  { type: "support" as const, label: "Support" },
];

export default async function ProcessusPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Cartographie des processus"
          description="Processus de pilotage, de réalisation et de support."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut de la page pour afficher sa cartographie."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom, type, description")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("ordre_affichage", { ascending: true });

  const items = processus ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Cartographie des processus"
        description="Processus de pilotage, de réalisation et de support."
      >
        <CreateProcessusDialog />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun processus"
          description="Créez votre premier processus pour démarrer la cartographie."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colItems = items.filter((p) => p.type === col.type);
            return (
              <Card key={col.type}>
                <CardHeader>
                  <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
                    {col.label}
                    <span className="ml-2 text-foreground">{colItems.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {colItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">—</p>
                  ) : (
                    colItems.map((p) => (
                      <div key={p.id} className="rounded-md border bg-surface px-3 py-2 text-sm">
                        <p className="font-medium">{p.nom}</p>
                        {p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                            {p.description}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
