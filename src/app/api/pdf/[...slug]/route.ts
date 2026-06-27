import { type NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/lib/pdf/browser";
import { getTenantContext } from "@/lib/tenant-context";

// La génération PDF (Chromium headless) demande un peu de marge côté temps
// d'exécution, et doit tourner sur le runtime Node (pas Edge).
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Génère un PDF fidèle d'un document maîtrisé en rendant la page `/print/...`
 * correspondante dans un Chromium headless, puis en renvoyant le fichier en
 * téléchargement direct (1 clic, sans la boîte d'impression du navigateur ni
 * ses en-têtes/pieds de page parasites).
 *
 * La page `/print` est protégée par la session Supabase : on transmet donc les
 * cookies de la requête au navigateur headless pour qu'il voie exactement ce
 * que voit l'utilisateur.
 *
 * Mapping : `/api/pdf/<segments>` rend `/print/<segments>`.
 * Ex. `/api/pdf/processus-fiche/<id>` → `/print/processus-fiche/<id>`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  // Garde-fou : seul un utilisateur authentifié peut générer un PDF.
  const ctx = await getTenantContext();
  if (!ctx.userId) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return NextResponse.json({ ok: false, error: "Document manquant." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const printUrl = `${origin}/print/${slug.map(encodeURIComponent).join("/")}`;

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // On rejoue la session de l'utilisateur dans le navigateur headless.
    const cookies = request.cookies
      .getAll()
      .map((c) => ({ name: c.name, value: c.value, url: origin }));
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 45_000 });

    const pdf = await page.pdf({
      printBackground: true,
      // Respecte les `@page { size; margin }` définis par chaque page /print
      // → mise en page strictement identique à l'aperçu.
      preferCSSPageSize: true,
      // Numéro de page « X/Y » en bas à droite (le footer se loge dans la marge
      // basse définie par le `@page` de la page /print). En-tête vide pour ne
      // pas réafficher la date/URL par défaut du moteur.
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;font-size:8px;color:#9ca3af;padding:0 14mm;text-align:right;">
        <span class="pageNumber"></span>/<span class="totalPages"></span>
      </div>`,
    });

    const filename = `${slug.join("-")}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Génération PDF échouée:", error);
    return NextResponse.json(
      { ok: false, error: "Génération du PDF impossible." },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}
