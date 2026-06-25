"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveProcedureLogigrammeAction } from "@/lib/actions/procedures";

const DRAWIO_ORIGIN = "https://embed.diagrams.net";
const DRAWIO_SRC = `${DRAWIO_ORIGIN}/?embed=1&proto=json&ui=min&spin=1&libraries=1&lang=fr`;

/**
 * Édition du logigramme d'une procédure via l'éditeur draw.io embarqué.
 * Le diagramme (XML) et son image (SVG) sont enregistrés dans la procédure ;
 * l'image s'affiche ensuite dans le document et le PDF.
 */
export function LogigrammeEditor({
  id,
  xml,
  svg,
}: {
  id: string;
  xml: string | null;
  svg: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pendingXml = useRef<string>("");

  async function persist(nextXml: string, nextSvg: string) {
    setPending(true);
    const result = await saveProcedureLogigrammeAction({ id, xml: nextXml, svg: nextSvg });
    setPending(false);
    setOpen(false);
    if (result.ok) {
      toast.success("Logigramme enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function onMessage(e: MessageEvent) {
    if (e.origin !== DRAWIO_ORIGIN) return;
    let msg: { event?: string; xml?: string; data?: string };
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    const frame = iframeRef.current?.contentWindow;
    if (msg.event === "init") {
      frame?.postMessage(JSON.stringify({ action: "load", xml: xml ?? "", autosave: 1 }), "*");
    } else if (msg.event === "save") {
      pendingXml.current = msg.xml ?? "";
      frame?.postMessage(JSON.stringify({ action: "export", format: "xmlsvg" }), "*");
    } else if (msg.event === "export") {
      void persist(pendingXml.current || (msg.xml ?? ""), msg.data ?? "");
    } else if (msg.event === "exit") {
      setOpen(false);
    }
  }

  function ouvrir() {
    window.addEventListener("message", onMessage);
    setOpen(true);
  }

  function fermer() {
    window.removeEventListener("message", onMessage);
    setOpen(false);
  }

  async function supprimer() {
    setPending(true);
    const result = await saveProcedureLogigrammeAction({ id, xml: "", svg: "" });
    setPending(false);
    if (result.ok) {
      toast.success("Logigramme supprimé.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {svg ? (
        // biome-ignore lint/performance/noImgElement: logigramme exporté (SVG data URL)
        <img
          src={svg}
          alt="Logigramme"
          className="max-h-80 w-auto max-w-full rounded-md border bg-white p-2"
        />
      ) : (
        <p className="text-muted-foreground text-sm">Aucun logigramme pour cette procédure.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={ouvrir} disabled={pending}>
          {svg ? "Modifier le logigramme" : "Créer un logigramme"}
        </Button>
        {svg ? (
          <Button
            type="button"
            variant="ghost"
            onClick={supprimer}
            disabled={pending}
            className="text-status-nc-mineure"
          >
            Supprimer
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/40">
          <div className="flex items-center justify-between bg-card px-4 py-2">
            <span className="font-medium text-sm">Éditeur de logigramme</span>
            <Button type="button" variant="outline" size="sm" onClick={fermer}>
              Fermer sans enregistrer
            </Button>
          </div>
          <iframe
            ref={iframeRef}
            title="Éditeur de logigramme"
            src={DRAWIO_SRC}
            className="min-h-0 flex-1 border-0 bg-white"
          />
        </div>
      ) : null}
    </div>
  );
}
