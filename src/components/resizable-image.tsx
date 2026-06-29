"use client";

import Image from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { DrawioModal } from "@/components/drawio-modal";
import { uploadLogigrammeAction } from "@/lib/actions/logigramme";

/**
 * Nœud image enrichi pour l'éditeur de contenu :
 *  - redimensionnable (poignée en bas à droite, largeur dans l'attribut `width`) ;
 *  - logigramme draw.io : `drawioUrl` pointe vers le XML stocké (ré-éditable).
 *    Le SVG et le XML vivent dans le stockage (URLs stables) et non plus en
 *    data-URL dans le document - fini les pertes à la sauvegarde.
 *    `drawioXml` (ancien attribut, XML en clair) reste lu pour rétro-compat.
 */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.style.width || el.getAttribute("width") || null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
      },
      drawioUrl: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-drawio-url"),
        renderHTML: (attrs) => (attrs.drawioUrl ? { "data-drawio-url": attrs.drawioUrl } : {}),
      },
      // Rétro-compat : anciens logigrammes avec le XML en clair dans le document.
      drawioXml: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-drawio-xml"),
        renderHTML: (attrs) => (attrs.drawioXml ? { "data-drawio-xml": attrs.drawioXml } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

function ResizableImageView({ node, updateAttributes, editor, selected }: NodeViewProps) {
  const { src, alt, width, drawioUrl, drawioXml } = node.attrs as {
    src: string;
    alt: string | null;
    width: string | null;
    drawioUrl: string | null;
    drawioXml: string | null;
  };
  const [editOpen, setEditOpen] = useState(false);
  const [initialXml, setInitialXml] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const editable = editor.isEditable;
  const isLogigramme = Boolean(drawioUrl) || Boolean(drawioXml);

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = imgRef.current?.offsetWidth ?? 0;
    function move(ev: MouseEvent) {
      const w = Math.max(80, startW + (ev.clientX - startX));
      updateAttributes({ width: `${Math.round(w)}px` });
    }
    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  // Ouvre l'éditeur : récupère le XML (depuis l'URL stockée, ou l'ancien attribut).
  async function openEditor() {
    setLoadingEdit(true);
    try {
      let xml = drawioXml ?? "";
      if (drawioUrl) {
        const res = await fetch(drawioUrl);
        xml = res.ok ? await res.text() : "";
      }
      setInitialXml(xml);
      setEditOpen(true);
    } catch {
      toast.error("Impossible de charger le logigramme.");
    } finally {
      setLoadingEdit(false);
    }
  }

  return (
    <NodeViewWrapper
      className="relative my-2 inline-block max-w-full align-top leading-none"
      style={{ width: width ?? "auto" }}
    >
      {/* biome-ignore lint/performance/noImgElement: contenu riche, document imprimable */}
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ""}
        draggable={false}
        className={
          editable && selected
            ? "block h-auto w-full rounded outline outline-2 outline-primary"
            : "block h-auto w-full"
        }
      />
      {editable ? (
        <>
          {isLogigramme ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openEditor}
              disabled={loadingEdit}
              className="absolute top-1 left-1 rounded bg-black/70 px-2 py-0.5 font-medium text-white text-xs hover:bg-black/85 disabled:opacity-60"
            >
              {loadingEdit ? "Ouverture…" : "Modifier le logigramme"}
            </button>
          ) : null}
          <span
            aria-hidden
            onMouseDown={startResize}
            className="absolute right-0 bottom-0 size-4 cursor-nwse-resize rounded-tl border border-white bg-primary"
          />
        </>
      ) : null}
      <DrawioModal
        open={editOpen}
        initialXml={initialXml}
        onSave={async (xml, svg) => {
          const result = await uploadLogigrammeAction(svg, xml);
          if (result.ok) {
            // On bascule sur les URLs stockées et on purge l'ancien XML en clair.
            updateAttributes({ src: result.svgUrl, drawioUrl: result.xmlUrl, drawioXml: null });
            setEditOpen(false);
          } else {
            toast.error(result.error);
          }
        }}
        onClose={() => setEditOpen(false)}
      />
    </NodeViewWrapper>
  );
}
