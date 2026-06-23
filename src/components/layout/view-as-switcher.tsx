"use client";

import { Check, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
import { setViewAsAction } from "@/lib/actions/view-as";
import { ROLE_LABELS, ROLES_SIMULABLES, type RoleSimulable } from "@/lib/view-as";

/**
 * Sélecteur de vue réservé aux admins Flowise : prévisualiser l'app sous un
 * autre rôle (dirigeant, manager, auditeur) sans changer ses droits réels.
 */
export function ViewAsSwitcher({ simulating, role }: { simulating: boolean; role: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function choisir(next: RoleSimulable | null) {
    setPending(true);
    const r = await setViewAsAction({ role: next });
    setPending(false);
    if (r.ok) {
      toast.success(next ? `Vue : ${ROLE_LABELS[next]}` : "Retour à la vue administrateur.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={simulating ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            disabled={pending}
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline">
              {simulating ? `Vue : ${ROLE_LABELS[role] ?? role}` : "Affichage"}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Prévisualiser en tant que</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => choisir(null)}>
          {!simulating ? <Check className="size-4" /> : <span className="size-4" />}
          Administrateur
        </DropdownMenuItem>
        {ROLES_SIMULABLES.map((r) => (
          <DropdownMenuItem key={r} onClick={() => choisir(r)}>
            {simulating && role === r ? <Check className="size-4" /> : <span className="size-4" />}
            {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
