import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SuiviConsultantForm } from "./suivi-consultant-form";

export const metadata = { title: "Suivi consultant" };

export default async function SuiviConsultantPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("nom_societe, logo_url")
    .eq("survey_token", token)
    .maybeSingle();

  if (!tenant) notFound();

  return (
    <div className="app-bg flex min-h-screen justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl bg-card p-7 shadow-soft ring-1 ring-foreground/10 sm:p-9">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {tenant.logo_url ? (
            // biome-ignore lint/performance/noImgElement: logo client (URL Supabase Storage)
            <img src={tenant.logo_url} alt={tenant.nom_societe} className="h-10 w-auto" />
          ) : (
            <Image
              src="/logo.png"
              alt=""
              width={500}
              height={230}
              className="h-7 w-auto"
              priority
            />
          )}
          <div>
            <h1 className="font-semibold text-xl tracking-tight">Suivi consultant</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Point de suivi terrain · {tenant.nom_societe}
            </p>
          </div>
        </div>
        <SuiviConsultantForm token={token} nomSociete={tenant.nom_societe} />
      </div>
    </div>
  );
}
