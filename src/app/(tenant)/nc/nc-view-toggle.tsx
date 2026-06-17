"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NcViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const vue = params.get("vue") === "kanban" ? "kanban" : "liste";

  function set(v: string) {
    const next = new URLSearchParams(params.toString());
    if (v === "kanban") next.set("vue", "kanban");
    else next.delete("vue");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg border bg-card p-0.5">
      <Button
        variant={vue === "liste" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => set("liste")}
      >
        Liste
      </Button>
      <Button
        variant={vue === "kanban" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => set("kanban")}
      >
        Kanban
      </Button>
    </div>
  );
}
