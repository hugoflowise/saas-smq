"use client";

import Image from "@tiptap/extension-image";
import { type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useRef, useState } from "react";
import { DrawioModal } from "@/components/drawio-modal";

/**
 * Nœud image enrichi pour l'éditeur de contenu :
 *  - redimensionnable (poignée en bas à droite, largeur stockée dans l'attribut `width`) ;
 *  - mémorise le schéma draw.io (`drawioXml`) d'un logigramme pour pouvoir le
 *    rouvrir et le modifier, sans avoir à le refaire.
 * Le rendu (lecture / impression) conserve la taille choisie.
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
  const { src, alt, width, drawioXml } = node.attrs as {
    src: string;
    alt: string | null;
    width: string | null;
    drawioXml: string | null;
  };
  const [editOpen, setEditOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const editable = editor.isEditable;

  // Redimensionnement à la souris : on suit le déplacement et on met à jour la
  // largeur (minimum 80px, jamais au-delà de la largeur du document).
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

  return (
    <NodeViewWrapper
      className="relative my-2 inline-block max-w-full align-top leading-none"
      style={{ width: width ?? "auto" }}
    >
      {/* biome-ignore lint/performance/noImgElement: contenu riche (data URL), document imprimable */}
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
          {drawioXml ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditOpen(true)}
              className="absolute top-1 left-1 rounded bg-black/70 px-2 py-0.5 font-medium text-white text-xs hover:bg-black/85"
            >
              Modifier le logigramme
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
        initialXml={drawioXml}
        onSave={(xml, svg) => {
          updateAttributes({ src: svg, drawioXml: xml });
          setEditOpen(false);
        }}
        onClose={() => setEditOpen(false)}
      />
    </NodeViewWrapper>
  );
}
