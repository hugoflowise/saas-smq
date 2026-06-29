import Image from "next/image";
import { ChangePasswordForm } from "@/app/(tenant)/compte/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Définition du mot de passe, atteinte via un lien d'invitation ou de
 * réinitialisation. Le lien connecte automatiquement l'utilisateur ; cette page
 * est volontairement HORS du shell applicatif (pas de menu) - comme la connexion.
 */
export default function BienvenuePage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <Image
          src="/logo.png"
          alt="flowise"
          width={500}
          height={230}
          priority
          className="mx-auto mb-2 h-9 w-auto"
        />
        <CardTitle className="text-xl">Définir votre mot de passe</CardTitle>
        <CardDescription>
          Choisissez un mot de passe pour accéder à votre espace qualité. Cette étape est
          obligatoire pour sécuriser votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm reloginAfter />
      </CardContent>
    </Card>
  );
}
