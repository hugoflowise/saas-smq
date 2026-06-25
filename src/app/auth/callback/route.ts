import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Callback d'authentification par lien e-mail. Deux cas :
 *  - `token_hash` + `type` : invitation / réinitialisation générées côté serveur
 *    (vérification de l'OTP, qui établit la session) ;
 *  - `code` : flux PKCE classique (magic link initié depuis le navigateur).
 *
 * IMPORTANT : on crée ici un client Supabase dont les cookies sont écrits
 * DIRECTEMENT sur la réponse de redirection. Sans cela, les cookies de session
 * posés par verifyOtp/exchangeCodeForSession ne sont pas transmis au navigateur
 * lors d'un `redirect()`, et la page cible rebondit vers /login (session absente).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // Réponse de succès (cookies de session ajoutés dessus par le client ci-dessous).
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return response;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
