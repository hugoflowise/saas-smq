"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadLogoSocieteAction } from "@/lib/actions/infos-societe";

/** Téléversement du logo de la société par le client lui-même (dirigeant). */
export function LogoForm({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setPending(true);
    const result = await uploadLogoSocieteAction(fd);
    setPending(false);
    if (result.ok) {
      toast.success("Logo mis à jour.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface">
        {logoUrl ? (
          // biome-ignore lint/performance/noImgElement: logo client (Supabase Storage), aperçu
          <img src={logoUrl} alt="Logo de la société" className="size-full object-contain p-1" />
        ) : (
          <span className="px-2 text-center text-muted-foreground text-xs">Aucun logo</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Téléversement…" : logoUrl ? "Changer le logo" : "Téléverser un logo"}
        </Button>
        <span className="text-muted-foreground text-xs">
          PNG, JPG ou SVG · 2 Mo max. Apparaît sur vos documents générés (politique, procédures,
          fiches…).
        </span>
      </div>
    </div>
  );
}
