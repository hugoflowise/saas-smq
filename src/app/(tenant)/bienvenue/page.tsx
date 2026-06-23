import Link from "next/link";
import { ChangePasswordForm } from "@/app/(tenant)/compte/change-password-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Page de définition du mot de passe, atteinte via un lien d'invitation ou de
 * réinitialisation. Le lien connecte automatiquement l'utilisateur ; cette
 * étape sécurise son compte avec un mot de passe personnel.
 */
export default function BienvenuePage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title="Définir votre mot de passe"
        description="Choisissez un mot de passe pour accéder à votre espace qualité."
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
