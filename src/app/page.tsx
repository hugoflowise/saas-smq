import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 text-center">
      <main className="flex max-w-xl flex-col items-center gap-6">
        <Badge variant="secondary">Phase 0 · Setup</Badge>
        <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight">
          Flowise — Pilotage SMQ
        </h1>
        <p className="text-balance text-lg text-muted-foreground">
          Outil de pilotage du Système de Management de la Qualité (ISO 9001:2015) pour les sociétés
          d&apos;ingénierie et ESN. Socle technique initialisé.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button>Accéder à l&apos;application</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </main>
    </div>
  );
}
