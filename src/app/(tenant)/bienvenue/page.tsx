import Link from "next/link";
import { ChangePasswordForm } from "@/app/(tenant)/compte/change-password-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Page d'accueil d'un utilisateur invité : il définit son mot de passe puis
 * accède à l'application. Le lien d'invitation le connecte automatiquement ;
 * cette étape sécurise son compte avec un mot de passe personnel.
 */
export default function BienvenuePage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title="Bienvenue 👋"
        description="Définissez votre mot de passe pour sécuriser votre accès."
      />
      <Card>
        <CardContent className="py-6">
          <ChangePasswordForm />
          <div className="mt-6 border-t pt-4">
            <Link href="/dashboard" className="text-primary text-sm hover:underline">
              Accéder à mon espace qualité →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
