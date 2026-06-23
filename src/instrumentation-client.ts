import * as Sentry from "@sentry/nextjs";

// Monitoring d'erreurs côté navigateur (Sentry). Défensif : sans DSN, inactif.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0.1,
  });
}

// Relie les changements de page (navigation App Router) au suivi Sentry.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
