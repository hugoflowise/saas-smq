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
import { logCommunicationEnvoyeeAction } from "@/lib/actions/communications-modeles";
import {
  appliquerVariables,
  construireMailto,
  type Modele,
  todayLabel,
} from "@/lib/communications";
import { SELECT_CLASS } from "@/lib/ui-classes";

export function EnvoyerModeleDialog({
  modele,
  societe,
  listeDiffusion,
}: {
  modele: Modele;
  societe: string;
  listeDiffusion: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [cible, setCible] = useState<"personne" | "societe">("personne");
  const [email, setEmail] = useState("");
  const [destinataire, setDestinataire] = useState("");

  const valeurs = { societe, destinataire, date: todayLabel() };
  const objet = appliquerVariables(modele.objet, valeurs);
  const corps = appliquerVariables(modele.corps, valeurs);
  const to = cible === "societe" ? (listeDiffusion ?? "") : email;

  async function envoyer() {
    if (cible === "societe" && !listeDiffusion) {
      toast.error("Aucune liste de diffusion configurée (Paramètres → Informations société).");
      return;
    }
    // Journalise d'abord (traçabilité ISO §7.4), puis ouvre le client mail.
    const audience = cible === "societe" ? "Toute la société" : email || "Destinataire";
    const r = await logCommunicationEnvoyeeAction({ sujet: objet, audience, message: corps });
    window.location.href = construireMailto({ to, objet, corps });
    if (!r.ok) toast.error(r.error);
    else toast.success("E-mail ouvert et communication enregistrée.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Send className="size-3.5" />
            Envoyer
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Envoyer : {modele.titre}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="destinataire">Nom (variable {"{destinataire}"})</Label>
                <Input
                  id="destinataire"
                  value={destinataire}
                  onChange={(e) => setDestinataire(e.target.value)}
                  placeholder="Prénom"
                />
              </div>
            </div>
          ) : (
            <p className="rounded-lg border bg-surface px-3 py-2 text-sm">
              {listeDiffusion ? (
                <>
                  Envoi à la liste de diffusion :{" "}
                  <span className="font-medium">{listeDiffusion}</span>
                </>
              ) : (
                <span className="text-status-nc-mineure">
                  Aucune liste de diffusion configurée. Renseignez-la dans Paramètres → Informations
                  société.
                </span>
              )}
            </p>
          )}

          {/* Aperçu */}
          <div className="flex flex-col gap-2">
            <Label>Aperçu</Label>
            <div className="rounded-lg border bg-surface px-3 py-2 text-sm">
              <p className="font-medium">{objet}</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{corps}</p>
            </div>
            <p className="text-muted-foreground text-xs">
              « Ouvrir dans la messagerie » prépare l'e-mail dans Outlook (ou votre client par
              défaut). Vous le relisez puis cliquez sur Envoyer.
            </p>
          </div>

          <Button onClick={envoyer} className="gap-1.5 self-start">
            <Send className="size-4" />
            Ouvrir dans la messagerie
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
