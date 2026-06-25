"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const DRAWIO_ORIGIN = "https://embed.diagrams.net";
const DRAWIO_SRC = `${DRAWIO_ORIGIN}/?embed=1&proto=json&ui=min&spin=1&libraries=1&lang=fr`;

/**
 * Éditeur de logigramme draw.io (diagrams.net) embarqué en plein écran.
 * À l'enregistrement, renvoie le diagramme (XML, ré-éditable) et son image SVG
 * (data URL). Réutilisable pour insérer des logigrammes dans le contenu.
 */
export function DrawioModal({
  open,
  initialXml,
  onSave,
  onClose,
}: {
  open: boolean;
  initialXml?: string | null;
  onSave: (xml: string, svg: string) => void;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pendingXml = useRef<string>("");

  useEffect(() => {
    if (!open) return;
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
        frame?.postMessage(
          JSON.stringify({ action: "load", xml: initialXml ?? "", autosave: 1 }),
          "*",
        );
      } else if (msg.event === "save") {
        pendingXml.current = msg.xml ?? "";
        frame?.postMessage(JSON.stringify({ action: "export", format: "xmlsvg" }), "*");
      } else if (msg.event === "export") {
        onSave(pendingXml.current || (msg.xml ?? ""), msg.data ?? "");
      } else if (msg.event === "exit") {
        onClose();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, initialXml, onSave, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40">
      <div className="flex items-center justify-between bg-card px-4 py-2">
        <span className="font-medium text-sm">Éditeur de logigramme</span>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
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
  );
}
