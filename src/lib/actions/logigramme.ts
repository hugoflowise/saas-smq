"use server";

import { canWrite } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant-context";

type UploadResult = { ok: true; svgUrl: string; xmlUrl: string } | { ok: false; error: string };

/** Décode une data URL SVG (base64 ou URL-encodée) en octets. */
function svgFromDataUrl(dataUrl: string): Buffer | null {
  const m = dataUrl.match(/^data:image\/svg\+xml(;base64)?,([\s\S]*)$/);
  if (!m) return null;
  return m[1] ? Buffer.from(m[2], "base64") : Buffer.from(decodeURIComponent(m[2]), "utf8");
}

/**
 * Persiste un logigramme draw.io dans le stockage (bucket public `tenant-assets`)
 * et renvoie les URLs stables du SVG (affichage) et du XML (ré-édition).
 *
 * Pourquoi : auparavant le SVG complet était stocké en data-URL DANS le contenu
 * du document et renvoyé à chaque sauvegarde automatique — fragile (poids,
 * échecs silencieux) et source de pertes. Désormais le document ne garde que
 * deux URLs légères.
 */
export async function uploadLogigrammeAction(
  svgDataUrl: string,
  xml: string,
): Promise<UploadResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const svg = svgFromDataUrl(svgDataUrl);
  if (!svg) return { ok: false, error: "Image du logigramme invalide." };

  const admin = createAdminClient();
  const base = `${ctx.effectiveTenantId}/logigrammes/${crypto.randomUUID()}`;

  const upSvg = await admin.storage
    .from("tenant-assets")
    .upload(`${base}.svg`, svg, { contentType: "image/svg+xml", upsert: true });
  if (upSvg.error)
    return { ok: false, error: `Upload du logigramme impossible : ${upSvg.error.message}` };

  const upXml = await admin.storage
    .from("tenant-assets")
    .upload(`${base}.xml`, Buffer.from(xml ?? "", "utf8"), {
      contentType: "application/xml",
      upsert: true,
    });
  if (upXml.error)
    return { ok: false, error: `Upload du logigramme impossible : ${upXml.error.message}` };

  const svgUrl = admin.storage.from("tenant-assets").getPublicUrl(`${base}.svg`).data.publicUrl;
  const xmlUrl = admin.storage.from("tenant-assets").getPublicUrl(`${base}.xml`).data.publicUrl;
  return { ok: true, svgUrl, xmlUrl };
}
