export const metadata = { title: "Conditions d'utilisation · Flowise Pilotage SMQ" };

// Modèle de CGU SaaS à faire valider juridiquement.
export default function CguPage() {
  return (
    <article>
      <h1>Conditions générales d'utilisation</h1>
      <p className="text-muted-foreground text-xs">Dernière mise à jour : juin 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales d'utilisation (les « CGU ») régissent l'accès et
        l'utilisation de l'application « Flowise Pilotage SMQ » (le « Service »), solution en ligne
        de pilotage du système de management de la qualité (norme ISO 9001), éditée par Flowise (l'«
        Éditeur »). L'utilisation du Service implique l'acceptation pleine et entière des présentes
        CGU.
      </p>

      <h2>2. Accès au Service et comptes</h2>
      <p>
        Le Service est accessible aux utilisateurs disposant d'un compte créé par l'Éditeur ou par
        le responsable (dirigeant) de leur organisation. Chaque utilisateur est responsable de la
        confidentialité de ses identifiants et de toute activité réalisée depuis son compte. Les
        rôles (dirigeant, manager, auditeur) déterminent les droits d'accès et de modification.
      </p>

      <h2>3. Description du Service</h2>
      <p>
        Le Service permet notamment de gérer la documentation qualité, les processus, les actions
        d'amélioration, les non-conformités, les audits, les indicateurs et la veille réglementaire,
        dans un environnement multi-organisations cloisonné. L'Éditeur peut faire évoluer les
        fonctionnalités du Service à tout moment.
      </p>

      <h2>4. Obligations de l'utilisateur</h2>
      <ul>
        <li>
          Utiliser le Service conformément à sa destination et à la réglementation en vigueur ;
        </li>
        <li>Ne pas tenter de porter atteinte à la sécurité ou à l'intégrité du Service ;</li>
        <li>Renseigner des informations exactes et tenir ses données à jour ;</li>
        <li>Ne pas utiliser le Service pour stocker des contenus illicites.</li>
      </ul>

      <h2>5. Disponibilité</h2>
      <p>
        L'Éditeur met en œuvre les moyens raisonnables pour assurer la disponibilité du Service. Des
        interruptions peuvent toutefois survenir, notamment pour maintenance ou pour des causes
        indépendantes de la volonté de l'Éditeur.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        Le Service et ses composants restent la propriété exclusive de l'Éditeur. Les données et
        contenus saisis par l'organisation cliente demeurent sa propriété ; l'organisation concède à
        l'Éditeur le droit de les héberger et de les traiter pour la fourniture du Service.
      </p>

      <h2>7. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>. Les modalités de sous-traitance
        des données pour le compte de l'organisation cliente peuvent faire l'objet d'un accord de
        sous-traitance dédié (DPA).
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        Le Service est un outil d'aide au pilotage de la qualité ; il ne se substitue pas au
        jugement professionnel de l'utilisateur ni à un conseil juridique ou de certification.
        L'Éditeur ne saurait être tenu responsable des décisions prises sur la base des informations
        gérées dans le Service. [à compléter : limitations de responsabilité selon le contrat
        commercial.]
      </p>

      <h2>9. Durée et résiliation</h2>
      <p>
        Les conditions de durée, de résiliation et de réversibilité (récupération des données) sont
        précisées dans le contrat commercial liant l'organisation cliente à l'Éditeur. [à
        compléter.]
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Les présentes CGU sont régies par le droit français. Tout litige relatif à leur
        interprétation ou à leur exécution relève des tribunaux compétents de [à compléter], à
        défaut de résolution amiable.
      </p>
    </article>
  );
}
