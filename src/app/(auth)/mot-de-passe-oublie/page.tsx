"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demanderResetMotDePasseAction } from "@/lib/actions/auth-reset";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    await demanderResetMotDePasseAction(email);
    setPending(false);
    // On affiche toujours le même message, que le compte existe ou non.
    setSent(true);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
        <CardDescription>
          {sent
            ? "Si un compte existe, un e-mail vient d'être envoyé."
            : "Indiquez votre e-mail pour recevoir un lien de réinitialisation."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              Consultez votre boîte mail (<strong>{email}</strong>) et suivez le lien pour définir
              un nouveau mot de passe.
            </p>
            <Link href="/login" className="text-primary text-sm hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@societe.fr"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer le lien"}
            </Button>
            <Link
              href="/login"
              className="text-center text-muted-foreground text-sm hover:text-foreground"
            >
              Retour à la connexion
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
