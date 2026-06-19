import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnqueteForm } from "./enquete-form";

export const metadata = { title: "Enquête de satisfaction" };

export default async function EnquetePubliquePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("nom_societe")
    .eq("survey_token", token)
    .maybeSingle();

  if (!tenant) notFound();

  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-card p-7 shadow-soft ring-1 ring-foreground/10 sm:p-9">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo.png" alt="" width={500} height={230} className="h-7 w-auto" priority />
          <div>
            <h1 className="font-semibold text-xl tracking-tight">Votre avis nous intéresse</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Quelques secondes pour évaluer votre expérience avec {tenant.nom_societe}.
            </p>
          </div>
        </div>
        <EnqueteForm token={token} nomSociete={tenant.nom_societe} />
      </div>
    </div>
  );
}
