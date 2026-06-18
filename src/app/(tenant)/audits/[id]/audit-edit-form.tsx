"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAuditAction } from "@/lib/actions/audits-revues";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type AuditDetail = {
  id: string;
  perimetre: string | null;
  processus_audites: string[] | null;
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
}: {
  audit: AuditDetail;
  processusOptions: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const selected = new Set(audit.processus_audites ?? []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await updateAuditAction({
      id: audit.id,
      perimetre: f.get("perimetre") || undefined,
      processusAudites: f.getAll("processusAudites").map(String),
      datePrevue: f.get("datePrevue") || undefined,
      dateRealisee: f.get("dateRealisee") || undefined,
      dureePrevue: f.get("dureePrevue") || undefined,
      statut: f.get("statut"),
      rapport: f.get("rapport") || undefined,
      ecartsConstates: f.get("ecartsConstates") || undefined,
    });
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="rapport">Rapport d'audit</Label>
        <Textarea id="rapport" name="rapport" rows={12} defaultValue={audit.rapport ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ecartsConstates">Écarts constatés</Label>
        <Textarea
          id="ecartsConstates"
          name="ecartsConstates"
          rows={6}
          defaultValue={audit.ecarts_constates ?? ""}
        />
        <p className="text-muted-foreground text-xs">
          Décrivez les écarts ici, puis créez les actions correctives associées dans l'encart
          ci-dessous.
        </p>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'audit"}
        </Button>
      </div>
    </form>
  );
}
