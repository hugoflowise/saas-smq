import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium headless (génération PDF) : ces paquets embarquent des binaires et
  // ne doivent pas être bundlés par Next, sinon le build casse / le binaire est
  // introuvable au runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Force l'inclusion des binaires Chromium (.br) dans la fonction serverless
  // de la route PDF : sans ça, le file-tracing Vercel les oublie et
  // `executablePath()` échoue au runtime.
  outputFileTracingIncludes: {
    "/api/pdf/[...slug]": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
