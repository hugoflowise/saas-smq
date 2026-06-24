import Link from "next/link";

/**
 * Lien cliquable vers la fiche d'un processus. Affiche « - » si aucun nom,
 * et le nom en texte simple si l'id est absent. Réutilisable partout où un
 * processus est cité (risques, actions, objectifs, documents, etc.).
 */
export function ProcessusLink({ id, nom }: { id: string | null; nom: string | null }) {
  if (!nom?.trim()) return <>-</>;
  if (!id) return <>{nom}</>;
  return (
    <Link href={`/processus/${id}`} className="text-primary hover:underline">
      {nom}
    </Link>
  );
}
