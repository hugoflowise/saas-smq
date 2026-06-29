"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { creerIdentitesTestAction } from "@/lib/actions/test-identities";

/**
 * Bouton (staging, admin) : crée les fiches « Manager flowise » / « Dirigeant
 * flowise » servant de signataires distincts pour tester un circuit complet.
 */
export function IdentitesTestButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const r = await creerIdentitesTestAction();
    setPending(false);
    if (r.ok) {
      toast.success("Identités de test prêtes : Manager flowise et Dirigeant flowise.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={run}>
      {pending ? "Création…" : "Créer les identités de test"}
    </Button>
  );
}
