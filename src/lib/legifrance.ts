import "server-only";

/**
 * Accès aux textes officiels via l'API Légifrance (plateforme PISTE de l'État).
 *
 * DÉFENSIF : tant que `LEGIFRANCE_CLIENT_ID` / `LEGIFRANCE_CLIENT_SECRET` ne
 * sont pas définis, toutes les fonctions renvoient un résultat vide sans
 * jamais lever d'erreur (la veille manuelle continue de fonctionner).
 *
 * Activation : créer un compte gratuit sur https://piste.gouv.fr, souscrire à
 * l'API « Légifrance », récupérer la clé OAuth (client_id / client_secret) et
 * les renseigner dans les variables d'environnement (voir .env.example).
 *
 * Les données de Légifrance sont sous Licence Ouverte de l'État : librement
 * réutilisables et rediffusables dans l'application.
 */

const OAUTH_URL = process.env.PISTE_OAUTH_URL ?? "https://oauth.piste.gouv.fr/api/oauth/token";
const API_BASE =
  process.env.LEGIFRANCE_API_BASE ?? "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

export type TexteOfficiel = {
  ref: string;
  titre: string;
  dateTexte: string | null;
  url: string | null;
};

export function legifranceConfigured(): boolean {
  return Boolean(process.env.LEGIFRANCE_CLIENT_ID && process.env.LEGIFRANCE_CLIENT_SECRET);
}

/** Jeton OAuth2 (client_credentials). null si non configuré ou en cas d'échec. */
async function getToken(): Promise<string | null> {
  const id = process.env.LEGIFRANCE_CLIENT_ID;
  const secret = process.env.LEGIFRANCE_CLIENT_SECRET;
  if (!id || !secret) return null;
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
      scope: "openid",
    });
    const res = await fetch(OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      console.error("[legifrance] OAuth échec :", res.status);
      return null;
    }
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch (err) {
    console.error("[legifrance] OAuth erreur :", err);
    return null;
  }
}

/**
 * Recherche les textes récents du Journal Officiel correspondant à des
 * mots-clés. Renvoie [] si non configuré ou en cas d'erreur (best-effort).
 *
 * NB : le format exact de la requête Légifrance est à affiner avec de vraies
 * identifiants ; en cas de réponse inattendue on renvoie [] pour ne jamais
 * casser l'application.
 */
export async function rechercherTextesRecents(
  motsCles: string[],
  joursRecents = 30,
): Promise<TexteOfficiel[]> {
  if (!legifranceConfigured() || motsCles.length === 0) return [];
  const token = await getToken();
  if (!token) return [];

  const depart = new Date(Date.now() - joursRecents * 86_400_000).toISOString().slice(0, 10);
  // Recherche dans le TITRE (bien plus pertinent que le plein texte) :
  // un texte dont le titre contient l'un des mots-clés.
  const requete = {
    recherche: {
      champs: [
        {
          typeChamp: "TITLE",
          criteres: [{ typeRecherche: "UN_DES_MOTS", valeur: motsCles.join(" "), operateur: "ET" }],
          operateur: "ET",
        },
      ],
      filtres: [{ facette: "DATE_SIGNATURE", dates: { start: depart } }],
      pageNumber: 1,
      pageSize: 20,
      operateur: "ET",
      sort: "SIGNATURE_DATE_DESC",
      typePagination: "DEFAUT",
    },
    fond: "JORF",
  };

  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requete),
    });
    if (!res.ok) {
      console.error("[legifrance] recherche échec :", res.status);
      return [];
    }
    const json = (await res.json()) as {
      results?: {
        titles?: { id?: string; cid?: string; title?: string }[];
        datePublication?: string | null;
      }[];
    };
    const textes: TexteOfficiel[] = [];
    const titresVus = new Set<string>();
    for (const r of json.results ?? []) {
      const t = r.titles?.[0];
      if (!t?.title && !t?.cid && !t?.id) continue;
      const cid = t?.cid ?? t?.id ?? null;
      // Nettoie les balises de surlignage <mark> renvoyées dans le titre.
      const titre = (t?.title ?? cid ?? "").replace(/<\/?mark>/g, "").trim();
      if (titresVus.has(titre)) continue; // dédoublonnage par titre
      titresVus.add(titre);
      textes.push({
        ref: cid ?? titre,
        titre,
        dateTexte: r.datePublication ? r.datePublication.slice(0, 10) : null,
        url: cid ? `https://www.legifrance.gouv.fr/jorf/id/${cid}` : null,
      });
    }
    return textes;
  } catch (err) {
    console.error("[legifrance] recherche erreur :", err);
    return [];
  }
}
