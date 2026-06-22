import { NextResponse } from "next/server";
import { legifranceConfigured, rechercherTextesRecents } from "@/lib/legifrance";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Veille réglementaire : récupère les textes officiels récents correspondant
 * aux mots-clés de chaque client et crée des « suggestions à examiner ».
 *
 * Déclenché par un Cron Vercel (voir vercel.json). Protégé par CRON_SECRET.
 * No-op si Légifrance n'est pas configuré (la veille manuelle reste active).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
    }
  }
  if (!legifranceConfigured()) {
    return NextResponse.json({ ok: true, skipped: "legifrance_non_configure", suggestions: 0 });
  }

  const admin = createAdminClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, veille_mots_cles")
    .not("veille_mots_cles", "is", null);
  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ ok: true, suggestions: 0, tenants: 0 });
  }

  let suggestions = 0;
  for (const tenant of tenants) {
    const motsCles = (tenant.veille_mots_cles ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (motsCles.length === 0) continue;

    const textes = await rechercherTextesRecents(motsCles, 30);
    for (const t of textes) {
      // upsert pour ignorer les doublons (clé unique tenant_id+source+ref).
      const { error } = await admin.from("veille_suggestions").upsert(
        {
          tenant_id: tenant.id,
          source: "legifrance",
          ref: t.ref,
          titre: t.titre,
          date_texte: t.dateTexte,
          url: t.url,
        },
        { onConflict: "tenant_id,source,ref", ignoreDuplicates: true },
      );
      if (!error) suggestions++;
    }
  }

  return NextResponse.json({ ok: true, tenants: tenants.length, suggestions });
}
