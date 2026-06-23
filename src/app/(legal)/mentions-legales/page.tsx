export const metadata = { title: "Mentions légales · flowise" };

export default function MentionsLegalesPage() {
  return (
    <article>
      <h1>Mentions légales</h1>
      <p className="text-muted-foreground text-xs">Dernière mise à jour : juin 2026</p>

      <h2>Éditeur</h2>
      <p>
        L'application « flowise » (l'« Application ») est éditée par la société Flowise, société par
        actions simplifiée (SAS) au capital de 5 000 euros, immatriculée au RCS de Paris sous le
        numéro 102 670 957, dont le siège social est situé 50 avenue des Champs-Élysées, 75008
        Paris.
      </p>
      <ul>
        <li>SIRET (siège) : 102 670 957 00012</li>
        <li>Numéro de TVA intracommunautaire : FR53102670957</li>
        <li>Adresse e-mail de contact : contact@flowise.fr</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>Hugo Piovesan, Président.</p>

      <h2>Hébergement de l'application</h2>
      <p>
        L'Application est hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
        États-Unis (<a href="https://vercel.com">vercel.com</a>).
      </p>

      <h2>Hébergement des données</h2>
      <p>
        Les données des utilisateurs sont hébergées par Supabase (infrastructure Amazon Web
        Services) au sein de l'Union européenne. Les détails relatifs au traitement des données
        personnelles figurent dans la <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments de l'Application (marques, logos, textes, interfaces, code) est la
        propriété de Flowise ou de ses partenaires et est protégé par le droit de la propriété
        intellectuelle. Toute reproduction non autorisée est interdite.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question relative aux présentes mentions, écrivez à contact@flowise.fr.</p>
    </article>
  );
}
