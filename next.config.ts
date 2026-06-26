import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium headless (génération PDF) : ces paquets embarquent des binaires et
  // ne doivent pas être bundlés par Next, sinon le build casse / le binaire est
  // introuvable au runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Force l'inclusion des binaires Chromium (.br) dans la fonction serverless
  // de la route PDF. Avec pnpm, `node_modules/@sparticuz/chromium` est un
  // symlink : il faut tracer le VRAI chemin `.pnpm` (sinon seul le lien est
  // copié et `executablePath()` ne trouve pas le dossier `bin/` au runtime).
  outputFileTracingIncludes: {
    "/api/pdf/[...slug]": [
      "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

export default nextConfig;
