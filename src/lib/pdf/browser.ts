import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

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
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  return puppeteer.launch({ executablePath, headless: true });
}
