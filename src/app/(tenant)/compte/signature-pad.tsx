"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateMaSignatureAction } from "@/lib/actions/compte";

const W = 440;
const H = 160;

/** Saisie de la signature manuscrite : dessin à la souris/au doigt ou import d'image. */
export function SignaturePad({ current }: { current: string | null }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);

  function ctx() {
    const c = canvasRef.current;
    return c ? c.getContext("2d") : null;
  }

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = ctx();
    if (!c) return;
    drawing.current = true;
    setDirty(true);
    const { x, y } = pos(e);
    c.beginPath();
    c.moveTo(x, y);
    c.lineWidth = 2;
    c.lineCap = "round";
    c.strokeStyle = "#0b1120";
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = ctx();
    if (!c) return;
    const { x, y } = pos(e);
    c.lineTo(x, y);
    c.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const c = ctx();
    if (c) c.clearRect(0, 0, W, H);
    setDirty(false);
  }

  function importImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = ctx();
        if (!c) return;
        c.clearRect(0, 0, W, H);
        const ratio = Math.min(W / img.width, H / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        c.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        setDirty(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function save() {
    const c = canvasRef.current;
    if (!c) return;
    setPending(true);
    const result = await updateMaSignatureAction(c.toDataURL("image/png"));
    setPending(false);
    if (result.ok) {
      toast.success("Signature enregistrée.");
      setDirty(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function remove() {
    setPending(true);
    const result = await updateMaSignatureAction("");
    setPending(false);
    if (result.ok) {
      toast.success("Signature supprimée.");
      clear();
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {current ? (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">Signature actuelle :</span>
          {/* biome-ignore lint/performance/noImgElement: signature (data URL) */}
          <img
            src={current}
            alt="Signature actuelle"
            className="h-12 w-auto rounded border bg-white object-contain px-2"
          />
        </div>
      ) : null}

      <p className="text-muted-foreground text-sm">
        Dessinez votre signature ci-dessous, ou importez une image. Elle sera apposée sur les
        documents que vous signez.
      </p>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full max-w-[440px] touch-none rounded-md border bg-white"
        style={{ aspectRatio: `${W} / ${H}` }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={pending || !dirty}>
          {pending ? "Enregistrement…" : "Enregistrer la signature"}
        </Button>
        <Button type="button" variant="outline" onClick={clear} disabled={pending}>
          Effacer
        </Button>
        <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
          Importer une image
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={importImage}
            className="hidden"
          />
        </label>
        {current ? (
          <Button
            type="button"
            variant="ghost"
            onClick={remove}
            disabled={pending}
            className="text-status-nc-mineure"
          >
            Supprimer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
