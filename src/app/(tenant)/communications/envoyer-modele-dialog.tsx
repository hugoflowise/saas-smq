"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logCommunicationEnvoyeeAction } from "@/lib/actions/communications-modeles";
import {
  appliquerVariables,
  construireMailto,
  type Modele,
  todayLabel,
} from "@/lib/communications";
import { useReadOnly } from "@/lib/hooks/read-only-context";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function EnvoyerModeleDialog({
  modele,
  societe,
  listeDiffusion,
  trigger,
}: {
  modele: Modele;
  societe: string;
  listeDiffusion: string | null;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [cible, setCible] = useState<"personne" | "societe">("personne");
  const [email, setEmail] = useState("");
  // Objet et corps préremplis depuis le modèle, variables {societe}/{date} résolues,
  // puis librement modifiables avant l'envoi.
  const valeurs = { societe, date: todayLabel() };
  const [objet, setObjet] = useState(() => appliquerVariables(modele.objet, valeurs));
  const [corps, setCorps] = useState(() => appliquerVariables(modele.corps, valeurs));
  const [envoi, setEnvoi] = useState(false);
  const readOnly = useReadOnly();

  const to = cible === "societe" ? (listeDiffusion ?? "") : email;

  async function envoyer() {
    if (cible === "societe" && !listeDiffusion) {
      toast.error("Aucune liste de diffusion configurée (Paramètres → Informations société).");
      return;
    }
    setEnvoi(true);
    // Journalise d'abord (traçabilité ISO §7.4), puis ouvre le client mail.
    const audience = cible === "societe" ? "Toute la société" : email || "Destinataire";
    const r = await logCommunicationEnvoyeeAction({ sujet: objet, audience, message: corps });
    window.location.href = construireMailto({ to, objet, corps });
    setEnvoi(false);
    if (!r.ok) toast.error(r.error);
    else toast.success("E-mail ouvert dans votre messagerie et communication enregistrée.");
    setOpen(false);
  }

  if (readOnly) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" className="gap-1.5">
              <Send className="size-3.5" />
              Envoyer
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{modele.titre}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cible">Destinataire</Label>
              <select
                id="cible"
                className={SELECT_CLASS}
                value={cible}
                onChange={(e) => setCible(e.target.value as "personne" | "societe")}
              >
                <option value="personne">Une personne</option>
                <option value="societe">Toute la société</option>
              </select>
            </div>
            {cible === "personne" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail du destinataire</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@exemple.fr"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Liste de diffusion</Label>
                <p className="flex h-9 items-center rounded-lg border bg-surface px-3 text-sm">
                  {listeDiffusion ? (
                    <span className="truncate font-medium">{listeDiffusion}</span>
                  ) : (
                    <span className="text-status-nc-mineure text-xs">
                      À configurer (Paramètres)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Objet et corps modifiables */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="objet">Objet</Label>
            <Input id="objet" value={objet} onChange={(e) => setObjet(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="corps">Message</Label>
            <Textarea
              id="corps"
              rows={10}
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Vous pouvez modifier l'objet et le message avant l'envoi.
            </p>
          </div>

          <Button onClick={envoyer} disabled={envoi} className="gap-1.5 self-start">
            <Send className="size-4" />
            {envoi ? "Ouverture…" : "Ouvrir dans la messagerie"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
