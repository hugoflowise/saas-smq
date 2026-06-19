"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquetePubliqueAction } from "@/lib/actions/enquete-publique";

export function EnqueteForm({ token, nomSociete }: { token: string; nomSociete: string }) {
  const [note, setNote] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (note === null) {
      setError("Merci de choisir une note de 0 à 10.");
      return;
    }
    setError(null);
    setPending(true);
    const f = new FormData(event.currentTarget);
    const result = await submitEnquetePubliqueAction({
      token,
      client: f.get("client") || undefined,
      noteRecommandation: note,
      noteSatisfaction: f.get("noteSatisfaction") || undefined,
      commentaire: f.get("commentaire") || undefined,
    });
    setPending(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-status-conforme/15 text-2xl text-status-conforme">
          ✓
        </div>
        <h2 className="font-semibold text-lg">Merci pour votre retour !</h2>
        <p className="text-muted-foreground text-sm">
          Votre réponse a bien été enregistrée. Elle nous aide à nous améliorer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>
          Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez {nomSociete} ?
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              className={`size-9 rounded-lg border font-medium text-sm transition-colors ${
                note === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Peu probable</span>
          <span>Très probable</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="noteSatisfaction">Note de satisfaction globale (sur 10) — optionnel</Label>
        <Input
          id="noteSatisfaction"
          name="noteSatisfaction"
          type="number"
          min={0}
          max={10}
          step="0.5"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="commentaire">Un commentaire ? (optionnel)</Label>
        <Textarea id="commentaire" name="commentaire" rows={4} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="client">Votre société / nom (optionnel)</Label>
        <Input id="client" name="client" />
      </div>

      {error ? <p className="text-sm text-status-nc-mineure">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer ma réponse"}
      </Button>
    </form>
  );
}
