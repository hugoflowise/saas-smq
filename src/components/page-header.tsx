import { Info } from "lucide-react";
import { getNormesActives } from "@/lib/normes-actives";
import { clauseBadge, referentielsBadge } from "@/lib/normes-libelles";

type PageHeaderProps = {
  title: string;
  description?: string;
  /**
   * Concept normatif de la page (ex. "audits", "revue", "politique"). Le badge
   * de chapitres s'adapte alors aux normes du client (« ISO 9001 §9.2 · MASE
   * Axe 4 »). Cas spécial "referentiels" : liste les référentiels actifs.
   */
  concept?: string;
  /**
   * Référence de clause en dur, ex. "ISO 9001 §9.1.2". Prioritaire sur `concept`
   * (pour les cas non couverts par le registre). Affichée en badge près du titre.
   */
  isoClause?: string;
  /** Texte pédagogique (exigence, méthode) affiché dans un encart « Aide » repliable. */
  help?: React.ReactNode;
  children?: React.ReactNode;
};

/** En-tête de page standard : titre + clause normative + description + aide + actions optionnelles. */
export async function PageHeader({
  title,
  description,
  concept,
  isoClause,
  help,
  children,
}: PageHeaderProps) {
  // Badge : clause en dur si fournie, sinon résolue depuis le concept selon les
  // normes actives du client.
  let badge = isoClause;
  if (!badge && concept) {
    const normes = await getNormesActives();
    badge = concept === "referentiels" ? referentielsBadge(normes) : clauseBadge(concept, normes);
  }
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
            {badge ? (
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{children}</div>
        ) : null}
      </div>
      {help ? (
        <details className="group rounded-lg border bg-surface text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground">
            <Info className="size-4 shrink-0" />
            <span className="font-medium">Aide & exigence</span>
            <span className="ml-auto text-xs group-open:hidden">Afficher</span>
            <span className="ml-auto hidden text-xs group-open:inline">Masquer</span>
          </summary>
          <div className="border-t px-3 py-2.5 text-muted-foreground leading-relaxed">{help}</div>
        </details>
      ) : null}
    </div>
  );
}
