import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { FormulaireType } from "@/lib/formulaire-modeles";
import { ingestSuiviConsultant, ingestSuiviPrestation } from "@/lib/suivi-ingest";
import { createAdminClient } from "@/lib/supabase/admin";

// Synchronisation des suivis remplis hors-ligne : le fichier HTML autonome
// (ouvert en local, origine « null ») poste ici ses réponses au retour du
// réseau. Auth par le `survey_token` du client, comme les formulaires publics.
// CORS ouvert (`*`) : aucune donnée sensible, aucune session, jeton dans le corps.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const schema = z.object({
  token: z.string().uuid(),
  reponses: z.record(z.string(), z.unknown()),
  modeleVersion: z.number().int().nullable().optional(),
  idempotencyKey: z.string().min(1).max(200),
});

const TYPES: Record<string, FormulaireType> = {
  suivi_consultant: "suivi_consultant",
  suivi_prestation: "suivi_prestation",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type: rawType } = await params;
  const type = TYPES[rawType];
  if (!type) {
    return NextResponse.json({ ok: false, error: "Type inconnu." }, { status: 404, headers: CORS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps invalide." },
      { status: 400, headers: CORS },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Requête invalide.";
    return NextResponse.json({ ok: false, error }, { status: 400, headers: CORS });
  }
  const { token, reponses, modeleVersion, idempotencyKey } = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("survey_token", token)
    .maybeSingle();
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "Jeton invalide." },
      { status: 401, headers: CORS },
    );
  }

  const result =
    type === "suivi_consultant"
      ? await ingestSuiviConsultant(
          admin,
          tenant.id,
          reponses,
          modeleVersion ?? null,
          idempotencyKey,
        )
      : await ingestSuiviPrestation(
          admin,
          tenant.id,
          reponses,
          modeleVersion ?? null,
          idempotencyKey,
        );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500, headers: CORS });
  }

  // `inserted: false` = réémission d'une clé déjà reçue → succès idempotent.
  return NextResponse.json({ ok: true, inserted: result.inserted }, { headers: CORS });
}
