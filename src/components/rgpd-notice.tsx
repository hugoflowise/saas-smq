import { ShieldCheck } from "lucide-react";

/**
 * Mention d'information RGPD affichée sur les formulaires publics (collecte de
 * données personnelles sans connexion). Le responsable de traitement est le
 * client (la société destinataire) ; Flowise est sous-traitant.
 */
export function RgpdNotice({ nomSociete }: { nomSociete: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/40 p-4 text-muted-foreground text-xs leading-relaxed">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-medium text-foreground">Protection de vos données.</span> Les
        informations saisies sont recueillies par {nomSociete} (responsable de traitement) pour la
        gestion et l'amélioration de son système qualité, sur la base de son intérêt légitime et de
        ses obligations. Elles sont destinées aux personnes habilitées de {nomSociete}, hébergées
        dans l'Union européenne et conservées pour la durée nécessaire à ce suivi. Conformément au
        RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition que
        vous pouvez exercer auprès de {nomSociete}.
      </p>
    </div>
  );
}
