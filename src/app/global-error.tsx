"use client";

import { useEffect } from "react";

/**
 * Filet de sécurité racine : capture les erreurs survenant au niveau du layout
 * racine (où error.tsx ne s'applique pas). Styles en ligne car la CSS globale
 * peut ne pas être chargée à ce niveau.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f7f7f5",
          color: "#0b1120",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
          Une erreur inattendue est survenue
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0, maxWidth: "28rem" }}>
          L'application a rencontré un problème. Réessayez ; si cela persiste, contactez le support.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: "2.25rem",
            padding: "0 1rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#ff5a5f",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
        {error.digest ? (
          <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: 0 }}>
            Référence : {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
