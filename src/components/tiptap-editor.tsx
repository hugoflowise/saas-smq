"use client";

import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DrawioModal } from "@/components/drawio-modal";
import { ResizableImage } from "@/components/resizable-image";
import { Button } from "@/components/ui/button";
import { uploadLogigrammeAction } from "@/lib/actions/logigramme";
import { cn } from "@/lib/utils";

/** Réduit une image importée (max 1200px de large) en data URL JPEG, pour limiter le poids. */
function reduireImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 1200;
        const ratio = Math.min(1, max / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Props = {
  content: JSONContent | null;
  editable: boolean;
  onChange?: (content: JSONContent) => void;
  /** Rendu document, sans cadre d'éditeur (pour l'aperçu/impression). */
  bare?: boolean;
};

const PROSE_CLASS = cn(
  "prose prose-sm max-w-none rounded-lg border bg-card px-4 py-3",
  "prose-headings:font-semibold prose-a:text-primary",
  "[&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none",
);

const BARE_CLASS = cn(
  "prose max-w-none prose-headings:font-semibold prose-a:text-primary",
  "[&_.ProseMirror]:outline-none",
);

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="size-8"
      aria-label={label}
      // Empêche l'éditeur de perdre la sélection au clic sur le bouton
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function TiptapEditor({ content, editable, onChange, bare = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [drawioOpen, setDrawioOpen] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, ResizableImage.configure({ allowBase64: true, inline: false })],
    content: content ?? "",
    editable,
    immediatelyRender: false,
    // IMPORTANT : `editor.getJSON()` renvoie des attrs en objets à prototype nul
    // (Object.create(null)). Passés tels quels à une Server Action, ils sont
    // supprimés par la sérialisation (React Flight) → un logigramme/image perd
    // src et data, donc disparaît à la sauvegarde. Le round-trip JSON rétablit
    // des objets normaux, sérialisables.
    onUpdate: ({ editor }) => onChange?.(JSON.parse(JSON.stringify(editor.getJSON()))),
    editorProps: { attributes: { class: "ProseMirror" } },
  });

  // `editable` peut changer après le montage (bascule « Modifier » sur un
  // document maîtrisé) : l'instance de l'éditeur n'est pas recréée, il faut
  // donc propager l'état modifiable manuellement.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return null;

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    try {
      const src = await reduireImage(file);
      editor.chain().focus().setImage({ src }).run();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {editable ? (
        <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
          <ToolbarButton
            label="Gras"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italique"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Titre 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Titre 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Titre 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Liste à puces"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Liste numérotée"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Image" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Logigramme" onClick={() => setDrawioOpen(true)}>
            <Workflow className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Annuler" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="size-4" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageFile}
            className="hidden"
          />
        </div>
      ) : null}
      <EditorContent editor={editor} className={bare ? BARE_CLASS : PROSE_CLASS} />
      <DrawioModal
        open={drawioOpen}
        onSave={async (xml, svg) => {
          if (!svg) {
            setDrawioOpen(false);
            return;
          }
          // Le SVG et le XML sont stockés (URLs stables) ; le document ne garde
          // que deux URLs légères → plus de perte à la sauvegarde.
          const result = await uploadLogigrammeAction(svg, xml);
          if (result.ok) {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "image",
                attrs: { src: result.svgUrl, drawioUrl: result.xmlUrl },
              })
              .run();
            setDrawioOpen(false);
          } else {
            toast.error(result.error);
          }
        }}
        onClose={() => setDrawioOpen(false)}
      />
    </div>
  );
}
