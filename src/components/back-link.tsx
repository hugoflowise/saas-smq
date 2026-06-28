import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Lien de retour standard en haut des pages détail (flèche + libellé). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
