"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchTenantAction } from "@/lib/actions/tenants";

type TenantOption = { id: string; nom: string };

export function TenantSwitcher({
  tenants,
  activeTenantId,
}: {
  tenants: TenantOption[];
  activeTenantId: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const active = tenants.find((t) => t.id === activeTenantId);

  async function handleSelect(id: string) {
    if (id === activeTenantId) return;
    setPending(true);
    await switchTenantAction(id);
    setPending(false);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2" disabled={pending}>
            <Building2 className="size-4" />
            <span className="max-w-[12rem] truncate">{active?.nom ?? "Choisir un client"}</span>
            <ChevronsUpDown className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tenant actif</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {tenants.length === 0 ? (
          <DropdownMenuItem disabled>Aucun client</DropdownMenuItem>
        ) : (
          tenants.map((t) => (
            <DropdownMenuItem key={t.id} onClick={() => handleSelect(t.id)}>
              <Check
                className={t.id === activeTenantId ? "size-4 opacity-100" : "size-4 opacity-0"}
              />
              <span className="truncate">{t.nom}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
