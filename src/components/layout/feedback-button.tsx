"use client";

import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createRetourAction,
  listMesRetoursAction,
  type MonRetour,
  supprimerMonRetourAction,
  updateMonRetourAction,
} from "@/lib/actions/retours";
import { compresserImage } from "@/lib/compress-image";
import { formatDateTime } from "@/lib/format";
import { RETOUR_STATUT_LABELS, RETOUR_TYPE_LABELS } from "@/lib/labels";
import { SELECT_CLASS } from "@/lib/ui-classes";

// Limite de corps de requête de la plateforme (~4,5 Mo sur Vercel) : on garde une
// marge sous ce seuil pour éviter un échec silencieux côté Server Action.
const MAX_ENVOI = 4 * 1024 * 1024;

// Couleur du statut, alignée sur le backlog admin.
const STATUT_BADGE: Record<string, string> = {
  nouveau: "bg-status-pa/15 text-status-pa",
  en_cours: "bg-primary/10 text-primary",
  traite: "bg-status-conforme/15 text-status-conforme",
  rejete: "bg-muted text-muted-foreground",
};

/**
 * Bouton de retour accessible depuis toutes les pages (topbar). Permet à tout
 * utilisateur de signaler un bug / une idée, et de retrouver, modifier ou
 * supprimer ses propres signalements.
 */
export function FeedbackButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // Vue courante : formulaire d'envoi/édition ou liste de mes signalements.
  const [view, setView] = useState<"form" | "liste">("form");
  // Retour en cours d'édition (null = création).
  const [editing, setEditing] = useState<MonRetour | null>(null);
  const [mesRetours, setMesRetours] = useState<MonRetour[]>([]);
  const [chargement, setChargement] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rafraichirListe = useCallback(async () => {
    setChargement(true);
    setMesRetours(await listMesRetoursAction());
    setChargement(false);
  }, []);

  // Charge la liste dès qu'on ouvre l'onglet « Mes signalements ».
  useEffect(() => {
    if (open && view === "liste") rafraichirListe();
  }, [open, view, rafraichirListe]);

  // Réinitialise l'état à la fermeture.
  useEffect(() => {
    if (!open) {
      setView("form");
      setEditing(null);
      setConfirmId(null);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      // Édition d'un signalement existant : uniquement les champs de saisie.
      if (editing) {
        const result = await updateMonRetourAction({
          id: editing.id,
          type: form.get("type"),
          titre: form.get("titre"),
          description: form.get("description") || undefined,
        });
        if (result.ok) {
          toast.success("Signalement mis à jour.");
          setEditing(null);
          setView("liste");
          await rafraichirListe();
          router.refresh();
        } else {
          toast.error(result.error);
        }
        return;
      }

      // Contexte : page d'où le retour est envoyé.
      form.set("pageUrl", typeof window !== "undefined" ? window.location.pathname : "");
      // Compression des images (captures d'écran surtout) avant envoi, pour
      // rester sous la limite de corps de requête de la plateforme.
      const fichiers = form
        .getAll("fichiers")
        .filter((f): f is File => f instanceof File && f.size > 0);
      if (fichiers.length > 0) {
        const compresses = await Promise.all(fichiers.map((f) => compresserImage(f)));
        const trop = compresses.find((f) => f.size > MAX_ENVOI);
        if (trop) {
          toast.error(
            `« ${trop.name} » est trop lourd même après compression. Joignez un fichier plus léger (max ~4 Mo).`,
          );
          return;
        }
        form.delete("fichiers");
        for (const f of compresses) form.append("fichiers", f);
      }

      const result = await createRetourAction(form);
      if (result.ok) {
        toast.success("Merci ! Votre retour a bien été transmis.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(
        "L'envoi a échoué (fichier trop volumineux ou réseau). Réessayez sans la pièce jointe.",
      );
    } finally {
      setPending(false);
    }
  }

  async function supprimer(id: string) {
    setPending(true);
    const result = await supprimerMonRetourAction({ id });
    setPending(false);
    setConfirmId(null);
    if (result.ok) {
      toast.success("Signalement supprimé.");
      await rafraichirListe();
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const enEdition = editing !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2" aria-label="Signaler ou suggérer">
            <MessageSquarePlus className="size-4" />
            <span className="hidden lg:inline">Signaler / Suggérer</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {enEdition ? "Modifier le signalement" : "Signaler ou suggérer"}
          </DialogTitle>
          <DialogDescription>
            Signalez un bug, une remarque ou une idée d'amélioration. L'équipe Flowise les examine.
          </DialogDescription>
        </DialogHeader>

        {/* Onglets : envoyer un retour / retrouver les miens. Masqués en édition. */}
        {!enEdition ? (
          <div className="flex gap-1 border-b">
            {(
              [
                { key: "form", label: "Envoyer" },
                { key: "liste", label: "Mes signalements" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                  view === t.key
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {view === "form" || enEdition ? (
          // key : réinitialise le formulaire selon l'ouverture / la cible d'édition.
          <form
            key={enEdition ? editing.id : String(open)}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className={SELECT_CLASS}
                defaultValue={editing?.type ?? "remarque"}
              >
                {Object.entries(RETOUR_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="titre">Objet</Label>
              <Input
                id="titre"
                name="titre"
                required
                defaultValue={editing?.titre ?? ""}
                placeholder="Ex. : le bouton Enregistrer ne réagit pas sur la page Risques"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Détail (facultatif)</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={editing?.description ?? ""}
                placeholder="Décrivez ce qui s'est passé, ce que vous attendiez, ou votre idée…"
              />
            </div>
            {/* Pièces jointes : à la création uniquement (pas en édition). */}
            {!enEdition ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="fichiers">Capture d'écran ou fichier (facultatif)</Label>
                <Input
                  id="fichiers"
                  name="fichiers"
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  Jusqu'à 4 fichiers. Les images sont automatiquement compressées. Une capture aide
                  beaucoup à comprendre.
                </p>
              </div>
            ) : null}
            <div className="mt-1 flex gap-2">
              {enEdition ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setView("liste");
                  }}
                >
                  Annuler
                </Button>
              ) : null}
              <Button type="submit" disabled={pending} className="flex-1">
                {pending
                  ? enEdition
                    ? "Enregistrement…"
                    : "Envoi…"
                  : enEdition
                    ? "Enregistrer"
                    : "Envoyer le retour"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {chargement ? (
              <p className="py-6 text-center text-muted-foreground text-sm">Chargement…</p>
            ) : mesRetours.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Vous n'avez envoyé aucun signalement pour l'instant.
              </p>
            ) : (
              mesRetours.map((r) => {
                const clos = r.statut === "traite" || r.statut === "rejete";
                return (
                  <div key={r.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {RETOUR_TYPE_LABELS[r.type]}
                          </Badge>
                          <Badge className={STATUT_BADGE[r.statut] ?? "bg-secondary"}>
                            {RETOUR_STATUT_LABELS[r.statut]}
                          </Badge>
                          <span className="text-muted-foreground text-xs">#{r.numero}</span>
                        </div>
                        <p className="mt-1.5 font-medium text-sm">{r.titre}</p>
                        {r.description ? (
                          <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground text-xs">
                            {r.description}
                          </p>
                        ) : null}
                        {r.noteAdmin ? (
                          <p className="mt-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                            <span className="font-medium">Réponse Flowise :</span> {r.noteAdmin}
                          </p>
                        ) : null}
                        <p className="mt-1 text-muted-foreground text-xs">
                          {formatDateTime(r.createdAt)}
                        </p>
                      </div>
                      {/* Actions : édition / suppression réservées à l'auteur.
                          Modification impossible une fois le retour clos. */}
                      {!clos ? (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Modifier"
                            title="Modifier"
                            onClick={() => {
                              setEditing(r);
                              setConfirmId(null);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            aria-label="Supprimer"
                            title="Supprimer"
                            onClick={() => setConfirmId(r.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {/* Confirmation de suppression en ligne (pas de confirm() natif). */}
                    {confirmId === r.id ? (
                      <div className="mt-2 flex items-center justify-end gap-2 border-t pt-2">
                        <span className="mr-auto text-muted-foreground text-xs">
                          Supprimer ce signalement ?
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => supprimer(r.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
