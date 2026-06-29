import { formatDate } from "@/lib/format";

export type DomaineExclusion = {
  clause: string;
  intitule: string;
  justification: string;
};

/** Instantané figé du domaine d'application au moment de la publication. */
export type DomaineSnapshot = {
  perimetre?: string | null;
  sites?: string | null;
  exclusions: DomaineExclusion[];
  dateEtablissement?: string | null;
  prochaineRevue?: string | null;
  valideLe?: string | null;
  validateur?: string | null;
};

/** Rendu en lecture seule d'un domaine d'application figé (historique des versions). */
export function DomaineSnapshotView({ snapshot }: { snapshot: DomaineSnapshot }) {
  const exclusions = snapshot.exclusions ?? [];
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-2 font-semibold text-sm">Périmètre du SMQ</h3>
        <p className="whitespace-pre-wrap text-sm">
          {snapshot.perimetre?.trim() ? (
            snapshot.perimetre
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-sm">Sites concernés</h3>
        <p className="whitespace-pre-wrap text-sm">
          {snapshot.sites?.trim() ? (
            snapshot.sites
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-sm">Exclusions justifiées</h3>
        {exclusions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune exclusion.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {exclusions.map((e, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: exclusions figées d'une version
                key={`${e.clause}-${i}`}
                className="rounded-xl border bg-card p-3 text-sm"
              >
                <p className="font-medium">
                  {e.clause ? <span className="font-mono text-xs">{e.clause}</span> : null}
                  {e.clause && e.intitule ? " · " : ""}
                  {e.intitule}
                </p>
                {e.justification ? (
                  <p className="mt-1 text-muted-foreground text-xs">{e.justification}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {snapshot.dateEtablissement || snapshot.prochaineRevue || snapshot.valideLe ? (
        <p className="text-muted-foreground text-sm">
          Établi le {formatDate(snapshot.dateEtablissement ?? null)} · Prochaine revue :{" "}
          {formatDate(snapshot.prochaineRevue ?? null)}
          {snapshot.valideLe
            ? ` · Validé le ${formatDate(snapshot.valideLe)}${snapshot.validateur ? ` par ${snapshot.validateur}` : ""}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
