import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

/** Affichage générique en l'absence de données ou pour un module à venir. */
export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      {Icon ? <Icon className="size-8 text-muted-foreground" aria-hidden /> : null}
      <h2 className="font-semibold text-lg">{title}</h2>
      {description ? <p className="max-w-sm text-muted-foreground text-sm">{description}</p> : null}
      {children}
    </div>
  );
}
