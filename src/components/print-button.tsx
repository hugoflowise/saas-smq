"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Imprimer / PDF" }: { label?: string }) {
  return (
    <Button size="sm" className="gap-2 print:hidden" onClick={() => print()}>
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
