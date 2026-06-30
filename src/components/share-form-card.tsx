import { ExternalLink, Mail } from "lucide-react";
import { CopyField } from "@/components/copy-field";
import { QrCode } from "@/components/qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ShareFormCardProps = {
  /** Lien public du formulaire (porté par le survey_token du tenant). */
  lien: string;
  /** Libellé du champ copiable (ex. « Lien à partager aux BM et consultants »). */
  copyLabel: string;
  /** Phrase d'explication sous les boutons. */
  hint: string;
  /** Objet de l'e-mail d'invitation pré-rempli. */
  emailSubject: string;
  /** Corps de l'e-mail (le lien est ajouté automatiquement à la suite). */
  emailIntro: string;
};

/**
 * Carte « Partager le formulaire » commune aux suivis et aux remontées :
 * QR code + lien copiable + ouverture + invitation par e-mail (mailto pré-rempli).
 * Diffusion sans connexion : on met le lien dans les mains des BM / consultants.
 */
export function ShareFormCard({
  lien,
  copyLabel,
  hint,
  emailSubject,
  emailIntro,
}: ShareFormCardProps) {
  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
    `${emailIntro}\n\n${lien}`,
  )}`;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Partager le formulaire</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <QrCode value={lien} />
        <div className="min-w-0 flex-1">
          <CopyField label={copyLabel} value={lien} />
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={lien}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-medium text-sm transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              Ouvrir le formulaire
            </a>
            <a
              href={mailto}
              className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-medium text-sm transition-colors hover:bg-muted"
            >
              <Mail className="size-4" />
              Inviter par e-mail
            </a>
          </div>
          <p className="mt-2 text-muted-foreground text-xs">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
