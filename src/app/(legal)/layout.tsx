import Image from "next/image";
import Link from "next/link";

/**
 * Mise en page des pages légales (publiques) : en-tête sobre, contenu lisible
 * en pleine largeur, retour vers la connexion. Styles typographiques appliqués
 * aux titres/paragraphes/listes via les variantes Tailwind.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6">
        <Link href="/login">
          <Image src="/logo.png" alt="Flowise" width={500} height={230} className="h-8 w-auto" />
        </Link>
        <Link href="/login" className="text-primary text-sm hover:underline">
          Retour à la connexion
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-4 text-foreground/80 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:font-semibold [&_h1]:text-2xl [&_h1]:text-foreground [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-base [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:font-medium [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}
