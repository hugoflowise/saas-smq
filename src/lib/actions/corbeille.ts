"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import { CORBEILLE_TABLES } from "@/lib/corbeille";
import { restoreRow } from "./soft-delete";

/**
 * Restaure un élément depuis la page corbeille. On revalide la table cible
 * (limitée aux tables exposées dans la corbeille) avant de déléguer au helper
 * générique `restoreRow` (gardes tenant + droits + lecture seule auditeur).
 */
export async function restoreFromCorbeilleAction(table: string, id: string): Promise<ActionResult> {
  const t = CORBEILLE_TABLES.find((x) => x === table);
  if (!t) return { ok: false, error: "Type d'élément non pris en charge." };

  const result = await restoreRow(t, id);
  if (result.ok) revalidatePath("/corbeille");
  return result;
}
