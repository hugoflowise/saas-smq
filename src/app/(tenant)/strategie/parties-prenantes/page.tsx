import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Parties prenantes"
        description="Registre des parties intéressées et de leurs attentes."
      />
      <EmptyState
        title="Module à venir"
        description="Ce module sera disponible dans une prochaine itération de la Phase 1."
      />
    </div>
  );
}
