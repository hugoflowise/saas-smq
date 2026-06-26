import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

/**
 * Archive Chromium chargée au runtime sur Vercel.
 *
 * Avec pnpm + Turbopack, le file-tracing de Vercel n'embarque pas de façon
 * fiable les binaires `.br` du paquet (symlink `.pnpm`) → `executablePath()`
 * échoue avec « directory does not exist ». La solution recommandée par
 * @sparticuz/chromium est de charger le pack depuis une URL : il est téléchargé
 * et décompressé dans `/tmp` au premier appel (puis mis en cache à chaud).
 *
 * Surchargeable via `CHROMIUM_PACK_URL` pour héberger soi-même l'archive
 * (ex. Vercel Blob) et ne plus dépendre des releases GitHub.
 */
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

/**
 * Lance un Chromium headless utilisable pour générer des PDF.
 *
 * - Sur Vercel (et tout environnement Linux serverless) : binaire embarqué via
 *   `@sparticuz/chromium`.
 * - En développement local : Chrome/Chromium installé sur la machine. Le chemin
 *   peut être forcé via `PUPPETEER_EXECUTABLE_PATH` ; sinon on tente les
 *   emplacements par défaut (macOS puis Linux).
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    // Désactive le mode graphique (WebGL) : inutile pour un PDF et plus léger
    // en mémoire sur le runtime serverless.
    chromium.setGraphicsMode = false;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });
  }

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  return puppeteer.launch({ executablePath, headless: true });
}
