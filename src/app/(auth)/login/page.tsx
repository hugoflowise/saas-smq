"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "password" | "link" | "sent" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handlePasswordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("password");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setMessage("E-mail ou mot de passe incorrect.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      setStatus("error");
      setMessage("Saisissez d'abord votre e-mail.");
      return;
    }
    setStatus("link");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
        <CardTitle className="text-2xl">Flowise · Pilotage SMQ</CardTitle>
        <CardDescription>
          {status === "sent"
            ? "Lien envoyé · consultez votre boîte mail."
            : "Connectez-vous à votre espace qualité."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "sent" ? (
          <p className="text-center text-muted-foreground text-sm">
            Un lien de connexion a été envoyé à <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {status === "error" && <p className="text-destructive text-sm">{message}</p>}

            <Button type="submit" disabled={status === "password"}>
              {status === "password" ? "Connexion…" : "Se connecter"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={status === "link"}
              onClick={handleMagicLink}
            >
              {status === "link" ? "Envoi…" : "Recevoir plutôt un lien par e-mail"}
            </Button>

            <Link
              href="/mot-de-passe-oublie"
              className="text-center text-muted-foreground text-sm hover:text-foreground"
            >
              Mot de passe oublié ?
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
