import { NextResponse } from "next/server";
import { z } from "zod";
import { todayISO } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook d'ingestion (Microsoft Forms via Power Automate).
// Auth par jeton tenant (header x-ingest-token ou ?token=). Pas de session.

const bodySchema = z.object({
  client: z.string().trim().optional(),
  dateReponse: z.string().trim().optional(),
  noteRecommandation: z.coerce.number().int().min(0).max(10).optional(),
  noteSatisfaction: z.coerce.number().min(0).max(10).optional(),
  commentaire: z.string().trim().optional(),
  estReclamation: z.coerce.boolean().optional(),
  source: z.string().trim().optional(),
});

function token(request: Request): string | null {
  const header = request.headers.get("x-ingest-token");
  if (header) return header.trim();
  const url = new URL(request.url);
  return url.searchParams.get("token");
}

export async function POST(request: Request) {
  const t = token(request);
  if (!t) {
    return NextResponse.json({ ok: false, error: "Jeton manquant." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("ingest_token", t)
    .maybeSingle();
  if (!tenant) {
    return NextResponse.json({ ok: false, error: "Jeton invalide." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }
  const d = parsed.data;

  const { error } = await admin.from("enquetes_satisfaction").insert({
    tenant_id: tenant.id,
    client: d.client ?? null,
    date_reponse: d.dateReponse || todayISO(),
    note_recommandation: d.noteRecommandation ?? null,
    note_satisfaction: d.noteSatisfaction ?? null,
    commentaire: d.commentaire ?? null,
    est_reclamation: d.estReclamation ?? false,
    source: d.source ?? "Microsoft Forms",
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
