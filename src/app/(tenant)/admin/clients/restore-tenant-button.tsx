"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { restoreTenantAction } from "@/lib/actions/tenants";

export function RestoreTenantButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRestore() {
    setPending(true);
    const result = await restoreTenantAction(tenantId);
    setPending(false);
    if (result.ok) {
      toast.success("Client restauré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={handleRestore}
    >
      <RotateCcw className="size-3.5" />
      {pending ? "Restauration…" : "Restaurer"}
    </Button>
  );
}
