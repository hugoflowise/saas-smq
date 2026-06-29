"use client";

import { CheckCircle2, ClipboardCheck, FileWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SignatureCapture } from "@/components/signature-capture";
import { Button } from "@/components/ui/button";
import { approveRevueAction, verifierRevueAction } from "@/lib/actions/audits-revues";

type Etat = {
  /** La revue est-elle complète (6 entrées + 3 sorties renseignées) ? */
  complete: boolean;
  /** Rubriques manquantes si incomplète. */
  manquants: string[];
  verifieParNom: string | null;
  /** Date de vérification déjà formatée (FR), ou null si non vérifiée. */
  verifieLe: string | null;
  approuveParNom: string | null;
  /** Date d'approbation déjà formatée (FR), ou null si non approuvée. */
  approuveLe: string | null;
  /** L'utilisateur courant peut-il vérifier (rôle écriture, hors auditeur) ? */
  peutVerifier: boolean;
  /** L'utilisateur courant peut-il approuver (direction) ? */
  peutApprouver: boolean;
  /** L'utilisateur courant est-il le vérificateur (séparation des tâches) ? */
  estVerificateur: boolean;
};

/**
 * Circuit de validation de la revue de direction (§9.3) : vérification puis
 * approbation + signature, avec verrou de complétude et séparation des tâches.
 */
export function RevueApprobation({ revueId, etat }: { revueId: string; etat: Etat }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const dejaVerifiee = Boolean(etat.verifieLe);
  const dejaApprouvee = Boolean(etat.approuveLe);

  async function verifier() {
    setPending(true);
    const result = await verifierRevueAction(revueId);
    setPending(false);
    if (result.ok) {
      toast.success("Revue vérifiée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function approuver() {
    const result = await approveRevueAction(revueId);
    if (result.ok) {
      toast.success("Revue approuvée et signée.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* État du circuit : Brouillon → Vérifiée → Approuvée/Signée */}
      <ol className="flex flex-col gap-1.5 text-sm">
        <Etape
          fait={dejaVerifiee}
          libelle="Vérifiée"
          detail={
            dejaVerifiee && etat.verifieLe
              ? `par ${etat.verifieParNom ?? "-"} le ${etat.verifieLe}`
              : "en attente de vérification"
          }
        />
        <Etape
          fait={dejaApprouvee}
          libelle="Approuvée et signée"
          detail={
            dejaApprouvee && etat.approuveLe
              ? `par ${etat.approuveParNom ?? "-"} le ${etat.approuveLe}`
              : "en attente d'approbation"
          }
        />
      </ol>

      {/* Verrou de complétude : on liste les rubriques manquantes. */}
      {!etat.complete && !dejaApprouvee ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs">
          <p className="flex items-center gap-1.5 font-medium">
            <FileWarning className="size-3.5" />
            Revue incomplète - à compléter avant vérification :
          </p>
          <ul className="mt-1.5 list-disc pl-5">
            {etat.manquants.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Actions : vérifier (writer) puis approuver+signer (direction ≠ vérificateur). */}
      <div className="flex flex-wrap items-center gap-2">
        {!dejaVerifiee && etat.peutVerifier ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={verifier}
            disabled={pending || !etat.complete}
          >
            <ClipboardCheck className="size-3.5" />
            {pending ? "Vérification…" : "Vérifier la revue"}
          </Button>
        ) : null}

        {dejaVerifiee && !dejaApprouvee && etat.peutApprouver && !etat.estVerificateur ? (
          <SignatureCapture
            triggerLabel="Approuver et signer"
            title="Approbation de la revue de direction"
            description="Confirmez votre identité avec votre mot de passe pour approuver et signer cette revue (§9.3)."
            disabled={!etat.complete}
            onSigned={approuver}
          />
        ) : null}

        {dejaVerifiee && !dejaApprouvee && etat.peutApprouver && etat.estVerificateur ? (
          <p className="text-muted-foreground text-xs">
            Vous avez vérifié cette revue : l'approbation revient à une autre personne (séparation
            des tâches).
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Etape({ fait, libelle, detail }: { fait: boolean; libelle: string; detail: string }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2
        className={`size-4 shrink-0 ${fait ? "text-emerald-600" : "text-muted-foreground/40"}`}
      />
      <span className={fait ? "font-medium" : "text-muted-foreground"}>
        {libelle}
        <span className="ml-1 font-normal text-muted-foreground text-xs">- {detail}</span>
      </span>
    </li>
  );
}
