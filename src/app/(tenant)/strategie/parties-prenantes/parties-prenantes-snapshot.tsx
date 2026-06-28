import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INTERACTION_LABELS,
  PRIORITE_CLASS,
  PRIORITE_LABELS,
  SPHERE_LABELS,
} from "@/lib/parties-prenantes";

export type PartiePrenanteSnap = {
  nom: string;
  sphere: string;
  type: string;
  interaction: string;
  pouvoir: number;
  legitimite: number;
  urgence: number;
  total: number;
  priorite: number;
  nbAttentes: number;
};

/** Instantané figé de la cartographie des parties prenantes à la publication. */
export type PartiesPrenantesSnapshot = {
  reference?: string | null;
  societe?: string | null;
  parties: PartiePrenanteSnap[];
};

/** Rendu en lecture seule d'une cartographie de parties prenantes figée. */
export function PartiesPrenantesSnapshotView({ snapshot }: { snapshot: PartiesPrenantesSnapshot }) {
  const parties = [...(snapshot.parties ?? [])].sort((a, b) => b.total - a.total);
  return (
    <div className="flex flex-col gap-4">
      {snapshot.reference?.trim() ? (
        <p className="text-muted-foreground text-sm">
          Référence : <span className="font-medium text-foreground">{snapshot.reference}</span>
        </p>
      ) : null}

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partie prenante</TableHead>
              <TableHead>Sphère</TableHead>
              <TableHead>Interaction</TableHead>
              <TableHead className="text-center">P / L / U</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Attentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-sm">
                  Aucune partie prenante dans cette version.
                </TableCell>
              </TableRow>
            ) : (
              parties.map((p) => (
                <TableRow key={p.nom}>
                  <TableCell className="font-medium">{p.nom}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {SPHERE_LABELS[p.sphere] ?? p.sphere}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {INTERACTION_LABELS[p.interaction] ?? p.interaction}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground text-sm">
                    {p.pouvoir} / {p.legitimite} / {p.urgence}
                  </TableCell>
                  <TableCell className="font-medium">{p.total}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${PRIORITE_CLASS[p.priorite]}`}
                    >
                      {PRIORITE_LABELS[p.priorite]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.nbAttentes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
