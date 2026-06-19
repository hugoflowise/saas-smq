import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <p className="font-semibold text-5xl text-primary tracking-tight">404</p>
      <div>
        <h1 className="font-semibold text-lg">Page introuvable</h1>
        <p className="mt-1 max-w-md text-muted-foreground text-sm">
          Cette page n'existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
