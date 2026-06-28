import { formatDate } from "@/lib/format";

/**
 * Bloc de signatures officiel partagé par tous les documents maîtrisés
 * (politique, procédure, fiche…), à l'écran comme à l'impression.
 *
 * S'appuie sur les variables CSS `--charte` / `--charte-contrast` posées par
 * `DocumentPaper` : doit donc être rendu à l'intérieur d'un `DocumentPaper`.
 */
export type SignataireCell = {
  label: string;
  nom: string | null;
  image: string | null;
  date: string | null;
  signe: boolean;
};

/** Cellule de signature (un rôle) avec image et horodatage. */
export function Signataire({
  label,
  nom,
  image,
  date,
  signe,
  border,
}: SignataireCell & { border?: boolean }) {
  return (
    <div className={border ? "border-l" : ""}>
      <div
        className="px-3 py-1.5 font-semibold"
        style={{ backgroundColor: "var(--charte)", color: "var(--charte-contrast)" }}
      >
        {label}
      </div>
      <div className="flex min-h-24 flex-col px-3 py-2">
        <p className="font-medium">{nom?.trim() ? nom : "-"}</p>
        {signe && image ? (
          // biome-ignore lint/performance/noImgElement: signature (data URL), document imprimable
          <img src={image} alt="Signature" className="mt-1 h-12 w-auto object-contain" />
        ) : null}
        {signe ? (
          <p className="mt-auto text-xs italic" style={{ color: "var(--charte)" }}>
            Signé électroniquement{date ? ` le ${formatDate(date)}` : ""}
          </p>
        ) : label === "Approuvé par" ? (
          <p className="mt-auto text-[#0b1120]/40 text-xs">En attente d'approbation</p>
        ) : null}
      </div>
    </div>
  );
}

/** Grille de signatures (2 ou 3 cellules selon le circuit). */
export function SignatairesBlock({
  cells,
  className,
}: {
  cells: SignataireCell[];
  className?: string;
}) {
  if (cells.length === 0) return null;
  const cols =
    cells.length >= 3 ? "grid-cols-3" : cells.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={`grid overflow-hidden rounded-md border text-sm ${cols} ${className ?? ""}`}>
      {cells.map((c, i) => (
        <Signataire key={c.label} {...c} border={i > 0} />
      ))}
    </div>
  );
}
