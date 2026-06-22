import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` est un garde-fou Next (interdit l'import côté client) ;
      // il n'existe pas à l'exécution sous Vitest. On le neutralise par un
      // module vide pour pouvoir tester la logique pure des fichiers serveur.
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
