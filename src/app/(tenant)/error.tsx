"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-status-nc-mineure/15 text-2xl text-status-nc-mineure">
        !
      </div>
      <div>
        <h1 className="font-semibold text-lg">Une erreur est survenue</h1>
        <p className="mt-1 max-w-md text-muted-foreground text-sm">
          Cette page n'a pas pu s'afficher. Réessayez ; si le problème persiste, contactez le
          support.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCw className="size-4" />
          Réessayer
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard">Tableau de bord</Link>}
        />
      </div>
      {error.digest ? (
        <p className="text-muted-foreground text-xs">Référence : {error.digest}</p>
      ) : null}
    </div>
  );
}
