import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium headless (génération PDF) : ces paquets embarquent des binaires et
  // ne doivent pas être bundlés par Next, sinon le build casse / le binaire est
  // introuvable au runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  experimental: {
    // Les retours (signaler/suggérer) peuvent embarquer des captures d'écran et
    // fichiers via la server action : la limite par défaut (1 Mo) est trop basse.
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
