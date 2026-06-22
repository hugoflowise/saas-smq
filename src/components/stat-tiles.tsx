import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTile = {
  /** Libellé court sous la valeur. */
  label: string;
  /** Valeur déjà formatée (nombre, pourcentage, « - »…). */
  value: ReactNode;
  /** Classe de couleur optionnelle pour la valeur (ex. status token). */
  cls?: string;
};

/**
 * Bandeau de tuiles de statistiques, uniforme et responsive.
 * 2 colonnes sur mobile, puis adaptées au nombre de tuiles.
 */
export function StatTiles({ tiles, className }: { tiles: StatTile[]; className?: string }) {
  const cols =
    tiles.length <= 2
      ? "sm:grid-cols-2"
      : tiles.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={cn("grid grid-cols-2 gap-4", cols, className)}>
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="py-5">
            <p className={cn("font-semibold text-3xl", t.cls)}>{t.value}</p>
            <p className="mt-1 text-muted-foreground text-xs">{t.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
