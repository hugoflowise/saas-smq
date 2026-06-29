import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./database.types";

/**
 * Préfixes de routes accessibles sans authentification.
 * `/api/cron` n'a pas de session (déclenché par le Cron Vercel) et se protège
 * lui-même via `CRON_SECRET`.
 */
const PUBLIC_PATHS = [
  "/login",
  "/mot-de-passe-oublie",
  "/mentions-legales",
  "/cgu",
  "/confidentialite",
  "/auth",
  "/api/ingest",
  "/api/cron",
  "/enquete",
  "/signalement",
];

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes
 * privées. À appeler depuis le middleware racine.
 *
 * NB : ne pas insérer de logique entre la création du client et `getUser()`
 * (risque de déconnexions aléatoires · cf. doc @supabase/ssr).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
