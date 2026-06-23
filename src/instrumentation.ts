import * as Sentry from "@sentry/nextjs";

// Monitoring d'erreurs côté serveur (Sentry). Défensif : sans DSN configuré,
// Sentry reste inactif (aucun effet, comme l'e-mail sans clé Resend).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (!dsn) return;
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? "development",
      tracesSampleRate: 0.1,
    });
  }
}

// Capture les erreurs serveur (rendu RSC, route handlers, server actions).
export const onRequestError = Sentry.captureRequestError;
