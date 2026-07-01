"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAuditAction } from "@/lib/actions/audits-revues";
import { IMPARTIALITE_MARQUEUR } from "@/lib/audit-impartialite";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import type { TenantMember } from "@/lib/tenant-users";
import { SELECT_CLASS } from "@/lib/ui-classes";

export type AuditDetail = {
  id: string;
  type_audit: string;
  organisme: string | null;
  perimetre: string | null;
  processus_audites: string[] | null;
  auditeur_id: string | null;
  date_prevue: string | null;
  date_realisee: string | null;
  duree_prevue: number | null;
  statut: string;
  rapport: string | null;
  ecarts_constates: string | null;
};

export function AuditEditForm({
  audit,
  processusOptions,
  auditeurs,
}: {
  audit: AuditDetail;
  processusOptions: { id: string; nom: string }[];
  auditeurs: TenantMember[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnly = useReadOnly();
  const selected = new Set(audit.processus_audites ?? []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const payload = {
      id: audit.id,
      typeAudit: f.get("typeAudit"),
      organisme: f.get("organisme") || undefined,
      perimetre: f.get("perimetre") || undefined,
      processusAudites: f.getAll("processusAudites").map(String),
      auditeurId: f.get("auditeurId") || undefined,
      datePrevue: f.get("datePrevue") || undefined,
      dateRealisee: f.get("dateRealisee") || undefined,
      dureePrevue: f.get("dureePrevue") || undefined,
      statut: f.get("statut"),
    };

    setPending(true);
    let result = await updateAuditAction(payload);

    // Garde-fou souple §9.2.2 : si l'auditeur est pilote d'un processus audité,
    // on demande confirmation puis on force l'enregistrement.
    if (!result.ok && result.error.includes(IMPARTIALITE_MARQUEUR)) {
      const confirme = window.confirm(`${result.error}\n\nEnregistrer malgré tout ?`);
      if (confirme) {
        result = await updateAuditAction({ ...payload, forcerImpartialite: true });
      } else {
        setPending(false);
        return;
      }
    }

    setPending(false);
    if (result.ok) {
      toast.success("Audit enregistré.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="typeAudit">Type d'audit</Label>
          <select
            id="typeAudit"
            name="typeAudit"
            className={SELECT_CLASS}
            defaultValue={audit.type_audit}
          >
            <option value="interne">Interne</option>
            <option value="externe">Externe (certification / client)</option>
            <option value="fournisseur">Fournisseur</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="organisme">Organisme</Label>
          <Input
            id="organisme"
            name="organisme"
            defaultValue={audit.organisme ?? ""}
            placeholder="Certificateur, client ou fournisseur (optionnel)"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="auditeurId">Auditeur</Label>
        <select
          id="auditeurId"
          name="auditeurId"
          className={SELECT_CLASS}
          defaultValue={audit.auditeur_id ?? ""}
        >
          <option value="">À désigner</option>
          {auditeurs.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          Impartialité (§9.2.2) : l'auditeur ne peut pas auditer un processus qu'il pilote.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="statut">Statut</Label>
          <select id="statut" name="statut" className={SELECT_CLASS} defaultValue={audit.statut}>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="realise">Réalisé</option>
            <option value="rapport_redige">Rapport rédigé</option>
            <option value="cloture">Clôturé</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="datePrevue">Date prévue</Label>
          <Input
            id="datePrevue"
            name="datePrevue"
            type="date"
            defaultValue={audit.date_prevue ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateRealisee">Date réalisée</Label>
          <Input
            id="dateRealisee"
            name="dateRealisee"
            type="date"
            defaultValue={audit.date_realisee ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dureePrevue">Durée (h)</Label>
          <Input
            id="dureePrevue"
            name="dureePrevue"
            type="number"
            step="any"
            defaultValue={audit.duree_prevue ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Processus audités</Label>
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-3 sm:grid-cols-3">
          {processusOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun processus défini.</p>
          ) : (
            processusOptions.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="processusAudites"
                  value={p.id}
                  defaultChecked={selected.has(p.id)}
                  className="size-4"
                />
                {p.nom}
              </label>
            ))
          )}
        </div>
        <Input
          name="perimetre"
          defaultValue={audit.perimetre ?? ""}
          placeholder="Précision libre du périmètre (optionnel)"
        />
      </div>

      {readOnly ? null : (
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer le contexte"}
          </Button>
        </div>
      )}
    </form>
  );
}
