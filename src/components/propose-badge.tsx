// Badge signalant un élément prérempli par Flowise et pas encore validé par
// le client. Présentational (rendu côté serveur possible). Voir aussi
// `propose-controls.tsx` pour le bouton de validation.
export function ProposeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-[10px] text-status-pa ${className}`}
    >
      Proposé · à valider
    </span>
  );
}
