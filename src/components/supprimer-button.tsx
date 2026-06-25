"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/types";
import { useReadOnly } from "@/lib/hooks/read-only-context";

/**
 * Bouton de suppression réutilisable. Met l'élément à la corbeille (soft-delete,
 * réversible) après confirmation. Masqué pour les rôles en lecture seule
 * (auditeur). L'action serveur reçoit l'identifiant et renvoie un `ActionResult`.
 */
export function SupprimerButton({
  action,
  id,
  libelle = "cet élément",
  confirmText,
  successText = "Supprimé.",
  redirectTo,
  label = "Supprimer",
  iconOnly = false,
  variant = "ghost",
  className,
}: {
  action: (id: string) => Promise<ActionResult>;
  id: string;
  /** Nom de l'élément, pour le message de confirmation par défaut. */
  libelle?: string;
  confirmText?: string;
  successText?: string;
  /** Si fourni, redirige après suppression (ex. retour à la liste depuis un détail). */
  redirectTo?: string;
  label?: string;
  iconOnly?: boolean;
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [pending, setPending] = useState(false);

  if (readOnly) return null;

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(confirmText ?? `Supprimer ${libelle} ? Il sera mis à la corbeille.`)) return;
    setPending(true);
    const r = await action(id);
    setPending(false);
    if (r.ok) {
      toast.success(successText);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Button
      type="button"
      size={iconOnly ? "icon" : "sm"}
      variant={variant}
      disabled={pending}
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      className={
        className ??
        (iconOnly
          ? "size-8 shrink-0 text-muted-foreground hover:text-destructive"
          : "h-8 shrink-0 gap-1.5 text-muted-foreground text-xs hover:text-destructive")
      }
    >
      <Trash2 className="size-3.5" />
      {iconOnly ? null : label}
    </Button>
  );
}
