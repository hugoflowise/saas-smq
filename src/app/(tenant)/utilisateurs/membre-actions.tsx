"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeMembreRoleAction, removeMembreAction } from "@/lib/actions/membres";
import { ROLE_MEMBRE_LABELS, ROLES_ASSIGNABLES } from "@/lib/permissions";
import { SELECT_CLASS_COMPACT } from "@/lib/ui-classes";

/** Sélecteur de rôle d'un membre (mise à jour immédiate). */
export function MembreRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const role = event.target.value;
    setPending(true);
    const r = await changeMembreRoleAction({ userId, role });
    setPending(false);
    if (r.ok) {
      toast.success("Rôle mis à jour.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <select
      className={SELECT_CLASS_COMPACT}
      defaultValue={role}
      disabled={pending}
      onChange={onChange}
      aria-label="Rôle"
    >
      {ROLES_ASSIGNABLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_MEMBRE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

/** Bouton de retrait d'accès d'un membre (avec confirmation). */
export function RemoveMembreButton({ userId, label }: { userId: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onRemove() {
    if (!window.confirm(`Retirer l'accès de ${label} ?`)) return;
    setPending(true);
    const r = await removeMembreAction({ userId });
    setPending(false);
    if (r.ok) {
      toast.success("Accès retiré.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={onRemove}
      aria-label="Retirer l'accès"
    >
      <Trash2 className="size-4 text-status-nc-mineure" />
    </Button>
  );
}
