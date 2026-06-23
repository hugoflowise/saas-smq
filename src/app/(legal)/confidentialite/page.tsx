export const metadata = { title: "Politique de confidentialité · Flowise Pilotage SMQ" };

// Modèle de politique de confidentialité (RGPD) à faire valider juridiquement.
export default function ConfidentialitePage() {
  return (
    <article>
      <h1>Politique de confidentialité</h1>
      <p className="text-muted-foreground text-xs">Dernière mise à jour : juin 2026</p>

      <p>
        La présente politique décrit la manière dont l'application « Flowise Pilotage SMQ » traite
        les données à caractère personnel, conformément au Règlement général sur la protection des
        données (RGPD) et à la loi « Informatique et Libertés ».
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Pour les données liées à la gestion du Service (comptes, accès), le responsable de
        traitement est Flowise [à compléter : raison sociale et adresse]. Pour les données saisies
        par une organisation cliente dans son espace, Flowise agit en qualité de sous-traitant, pour
        le compte de l'organisation cliente (responsable de traitement).
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Données de compte : nom, adresse e-mail, rôle, organisation de rattachement ;</li>
        <li>
          Données d'usage et techniques : journaux de connexion, adresse IP, type de navigateur ;
        </li>
        <li>Données métier saisies dans le Service par les utilisateurs de l'organisation.</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>Fourniture et sécurisation du Service (exécution du contrat) ;</li>
        <li>Gestion des accès et de l'authentification (exécution du contrat) ;</li>
        <li>Envoi de notifications et d'e-mails liés au Service (intérêt légitime / contrat) ;</li>
        <li>Amélioration et supervision technique, détection des erreurs (intérêt légitime).</li>
      </ul>

      <h2>4. Destinataires et sous-traitants</h2>
      <p>
        Les données sont accessibles aux personnes habilitées de l'organisation cliente et de
        l'Éditeur. L'Éditeur fait appel aux sous-traitants suivants :
      </p>
      <ul>
        <li>
          Supabase (hébergement de la base de données et des fichiers, infrastructure AWS, Union
          européenne) ;
        </li>
        <li>Vercel (hébergement et diffusion de l'application) ;</li>
        <li>Resend (envoi des e-mails transactionnels) ;</li>
        <li>Sentry (supervision technique et détection des erreurs).</li>
      </ul>
      <p>
        Chaque sous-traitant présente des garanties appropriées et n'utilise les données que pour
        les besoins du Service.
      </p>

      <h2>5. Transferts hors Union européenne</h2>
      <p>
        Lorsque certains prestataires sont susceptibles de traiter des données hors de l'Union
        européenne, ces transferts sont encadrés par des garanties appropriées (clauses
        contractuelles types de la Commission européenne). [à compléter / confirmer selon les
        prestataires retenus.]
      </p>

      <h2>6. Durées de conservation</h2>
      <p>
        Les données sont conservées pendant la durée de la relation contractuelle, puis archivées ou
        supprimées dans des délais raisonnables. [à compléter : durées précises par catégorie de
        données.]
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de
        portabilité et d'opposition au traitement de vos données. Pour les données métier d'une
        organisation cliente, ces demandes sont à adresser à cette organisation (responsable de
        traitement). Pour exercer vos droits, contactez [à compléter : adresse e-mail dédiée / DPO].
      </p>

      <h2>8. Réclamation</h2>
      <p>
        Vous pouvez introduire une réclamation auprès de la Commission nationale de l'informatique
        et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris (
        <a href="https://www.cnil.fr">cnil.fr</a>
        ).
      </p>

      <h2>9. Cookies et traceurs</h2>
      <p>
        L'application utilise uniquement les cookies strictement nécessaires à son fonctionnement
        (authentification, sécurité). Aucun cookie publicitaire n'est déposé. [à compléter si des
        outils de mesure d'audience sont ajoutés.]
      </p>

      <h2>10. Contact</h2>
      <p>Pour toute question relative à la présente politique : [à compléter : adresse e-mail].</p>
    </article>
  );
}
