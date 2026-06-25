"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Champ en lecture seule avec bouton « Copier » (lien public, jeton…). */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs">
          {value}
        </code>
        <Button variant="outline" size="icon" aria-label="Copier" onClick={copy}>
          {copied ? <Check className="size-4 text-status-conforme" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
