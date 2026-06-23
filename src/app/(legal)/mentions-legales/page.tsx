export const metadata = { title: "Mentions légales · Flowise Pilotage SMQ" };

// Modèle à faire valider juridiquement. Les [à compléter] sont à renseigner.
export default function MentionsLegalesPage() {
  return (
    <article>
      <h1>Mentions légales</h1>
      <p className="text-muted-foreground text-xs">Dernière mise à jour : juin 2026</p>

      <h2>Éditeur</h2>
      <p>
        L'application « Flowise Pilotage SMQ » est éditée par Flowise, [à compléter : forme
        juridique, ex. SAS] au capital de [à compléter] euros, immatriculée au RCS de [à compléter]
        sous le numéro [à compléter : SIREN], dont le siège social est situé [à compléter : adresse
        complète].
      </p>
      <ul>
        <li>Numéro de TVA intracommunautaire : [à compléter]</li>
        <li>Adresse e-mail de contact : [à compléter, ex. contact@flowise.fr]</li>
        <li>Téléphone : [à compléter]</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>[à compléter : nom du représentant légal].</p>

      <h2>Hébergement de l'application</h2>
      <p>
        L'application est hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
        États-Unis (<a href="https://vercel.com">vercel.com</a>).
      </p>

      <h2>Hébergement des données</h2>
      <p>
        Les données des utilisateurs sont hébergées par Supabase (infrastructure Amazon Web
        Services), au sein de l'Union européenne [à confirmer : région d'hébergement]. Les détails
        relatifs au traitement des données personnelles figurent dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments de l'application (marques, logos, textes, interfaces, code) est la
        propriété de Flowise ou de ses partenaires et est protégé par le droit de la propriété
        intellectuelle. Toute reproduction non autorisée est interdite.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions, écrivez à [à compléter : adresse e-mail
        de contact].
      </p>
    </article>
  );
}
