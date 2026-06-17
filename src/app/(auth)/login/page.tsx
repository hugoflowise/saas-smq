"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Flowise — Pilotage SMQ</CardTitle>
        <CardDescription>
          {status === "sent"
            ? "Lien envoyé — consultez votre boîte mail."
            : "Connectez-vous avec votre adresse e-mail."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "sent" ? (
          <p className="text-center text-muted-foreground text-sm">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Cliquez dessus pour
            accéder à l&apos;application.
          </p>
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
            {status === "error" && <p className="text-destructive text-sm">{message}</p>}
            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Envoi…" : "Recevoir le lien de connexion"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
