"use client";

import { Check, Link2, Pencil, Plus, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SupprimerButton } from "@/components/supprimer-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createEngagementAction,
  deleteEngagementAction,
  setEngagementObjectifsAction,
  updateEngagementAction,
} from "@/lib/actions/engagements";
import { useReadOnly } from "@/lib/hooks/read-only-context";

export type EngagementCouverture = {
  id: string;
  libelle: string;
  objectifs: {
    id: string;
    intitule: string;
    indicateurs: { id: string; nom: string }[];
  }[];
};

export type ObjectifOption = { id: string; intitule: string };

/** Un engagement est « couvert » s'il a ≥ 1 objectif ayant ≥ 1 indicateur de mesure. */
function estCouvert(e: EngagementCouverture): boolean {
  return e.objectifs.some((o) => o.indicateurs.length > 0);
}

export function EngagementsCard({
  engagements,
  tousObjectifs = [],
}: {
  engagements: EngagementCouverture[];
  tousObjectifs?: ObjectifOption[];
}) {
  const router = useRouter();
  const readOnly = useReadOnly();
  const [nouveau, setNouveau] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLibelle, setEditLibelle] = useState("");
  const [pending, setPending] = useState(false);
  // Liaison d'objectifs : id de l'engagement en cours d'édition + sélection.
  const [lierId, setLierId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  function ouvrirLiaison(e: EngagementCouverture) {
    setLierId(e.id);
    setSelection(new Set(e.objectifs.map((o) => o.id)));
  }

  async function enregistrerLiaison() {
    if (!lierId) return;
    setPending(true);
    const r = await setEngagementObjectifsAction({
      engagementId: lierId,
      objectifIds: [...selection],
    });
    setPending(false);
    if (r.ok) {
      setLierId(null);
      toast.success("Objectifs liés mis à jour.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  async function ajouter() {
    if (!nouveau.trim()) return;
    setPending(true);
    const r = await createEngagementAction({ libelle: nouveau });
    setPending(false);
    if (r.ok) {
      setNouveau("");
      toast.success("Engagement ajouté.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  async function enregistrerEdit() {
    if (!editId || !editLibelle.trim()) return;
    setPending(true);
    const r = await updateEngagementAction({ id: editId, libelle: editLibelle });
    setPending(false);
    if (r.ok) {
      setEditId(null);
      toast.success("Engagement mis à jour.");
      router.refresh();
    } else {
      toast.error(r.error);
    }
  }

  const couverts = engagements.filter(estCouvert).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Engagements de la politique qualité
          <span className="font-normal text-muted-foreground text-xs">ISO 9001 §6.2</span>
          {engagements.length > 0 ? (
            <span className="ml-auto font-normal text-muted-foreground text-sm">
              {couverts}/{engagements.length} couverts par un objectif + KPI
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Déclinez chaque engagement de votre politique en objectif(s), mesuré(s) par des
          indicateurs. Les engagements non couverts sont signalés.
        </p>

        {engagements.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-muted-foreground text-sm">
            Aucun engagement saisi. Ajoutez les engagements de votre politique qualité ci-dessous.
          </p>
        ) : (
          <div className="flex flex-col divide-y rounded-lg border">
            {engagements.map((e) => {
              const couvert = estCouvert(e);
              return (
                <div key={e.id} className="flex flex-col gap-1.5 p-3">
                  <div className="flex items-start gap-2">
                    {couvert ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-status-conforme" />
                    ) : (
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-pa" />
                    )}
                    {editId === e.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editLibelle}
                          onChange={(ev) => setEditLibelle(ev.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={enregistrerEdit}
                          disabled={pending}
                          aria-label="Valider"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditId(null)}
                          aria-label="Annuler"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-sm">{e.libelle}</span>
                        {!readOnly ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditId(e.id);
                                setEditLibelle(e.libelle);
                              }}
                              aria-label="Modifier"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <SupprimerButton
                              action={deleteEngagementAction}
                              id={e.id}
                              libelle={`l'engagement « ${e.libelle} »`}
                              iconOnly
                            />
                          </>
                        ) : null}
                      </>
                    )}
                  </div>
                  {/* Couverture : objectifs → indicateurs */}
                  <div className="pl-6">
                    {e.objectifs.length === 0 ? (
                      <span className="text-status-pa text-xs">
                        Aucun objectif rattaché - ouvrez un objectif pour le relier à cet
                        engagement.
                      </span>
                    ) : (
                      <ul className="flex flex-col gap-0.5">
                        {e.objectifs.map((o) => (
                          <li key={o.id} className="text-xs">
                            <span className="text-muted-foreground">↳ {o.intitule}</span>
                            {o.indicateurs.length > 0 ? (
                              <span className="text-muted-foreground">
                                {" "}
                                ·{" "}
                                {o.indicateurs.map((ind, i) => (
                                  <span key={ind.id}>
                                    {i > 0 ? ", " : ""}
                                    <Link
                                      href={`/indicateurs/${ind.id}?from=/strategie/objectifs`}
                                      className="text-primary hover:underline"
                                    >
                                      {ind.nom}
                                    </Link>
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-status-pa"> · sans indicateur</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Liaison des objectifs depuis l'engagement. */}
                    {!readOnly && lierId === e.id ? (
                      <div className="mt-2 flex flex-col gap-2 rounded-lg border bg-card p-2">
                        {tousObjectifs.length === 0 ? (
                          <p className="text-muted-foreground text-xs">
                            Aucun objectif à lier. Créez d'abord des objectifs.
                          </p>
                        ) : (
                          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
                            {tousObjectifs.map((o) => (
                              <label
                                key={o.id}
                                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/50"
                              >
                                <input
                                  type="checkbox"
                                  className="size-3.5"
                                  checked={selection.has(o.id)}
                                  onChange={(ev) =>
                                    setSelection((prev) => {
                                      const next = new Set(prev);
                                      if (ev.target.checked) next.add(o.id);
                                      else next.delete(o.id);
                                      return next;
                                    })
                                  }
                                />
                                {o.intitule}
                              </label>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={enregistrerLiaison} disabled={pending}>
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setLierId(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : !readOnly ? (
                      <button
                        type="button"
                        onClick={() => ouvrirLiaison(e)}
                        className="mt-1 inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      >
                        <Link2 className="size-3" /> Lier des objectifs
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!readOnly ? (
          <div className="flex items-center gap-2">
            <Input
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              placeholder="Nouvel engagement (ex. : satisfaire durablement nos clients)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ajouter();
                }
              }}
            />
            <Button onClick={ajouter} disabled={pending || !nouveau.trim()} className="gap-2">
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
