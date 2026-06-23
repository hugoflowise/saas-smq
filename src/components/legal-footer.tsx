import Link from "next/link";

// Liens légaux, partagés par l'espace connecté et les écrans de connexion.
const LIENS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "Conditions d'utilisation" },
  { href: "/confidentialite", label: "Confidentialité" },
];

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground text-xs ${className}`}
    >
      <a
        href="https://flowise.fr"
        target="_blank"
        rel="noopener"
        className="font-medium hover:text-foreground hover:underline"
      >
        flowise.
      </a>
      {LIENS.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-foreground hover:underline">
          {l.label}
        </Link>
      ))}
    </footer>
  );
}
