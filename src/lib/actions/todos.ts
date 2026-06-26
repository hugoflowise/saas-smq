"use server";

import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

/** Contexte commun : utilisateur authentifié (le pense-bête est personnel, sans tenant). */
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

/** Purge paresseuse : supprime les tâches cochées les jours précédents. */
async function purgeAnciennes(c: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  await c.supabase
    .from("todos_perso")
    .delete()
    .eq("user_id", c.userId)
    .eq("done", true)
    .lt("done_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
}

const addSchema = z.object({ texte: z.string().trim().min(1, "Texte requis.").max(500) });

/** Ajoute une tâche au pense-bête de l'utilisateur courant. */
export async function addTodoAction(input: unknown): Promise<CreateResult> {
  const c = await currentUser();
  if (!c) return { ok: false, error: "Non authentifié." };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };

  await purgeAnciennes(c);

  const { data, error } = await c.supabase
    .from("todos_perso")
    .insert({ user_id: c.userId, texte: parsed.data.texte })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Ajout impossible." };
  return { ok: true, id: data.id };
}

const toggleSchema = z.object({ id: z.string().uuid(), done: z.boolean() });

/** Coche / décoche une tâche (met à jour la date pour la purge du lendemain). */
export async function toggleTodoAction(input: unknown): Promise<ActionResult> {
  const c = await currentUser();
  if (!c) return { ok: false, error: "Non authentifié." };

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const { error } = await c.supabase
    .from("todos_perso")
    .update({ done: parsed.data.done, done_at: parsed.data.done ? new Date().toISOString() : null })
    .eq("id", parsed.data.id)
    .eq("user_id", c.userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const deleteSchema = z.object({ id: z.string().uuid() });

/** Supprime définitivement une tâche du pense-bête. */
export async function deleteTodoAction(input: unknown): Promise<ActionResult> {
  const c = await currentUser();
  if (!c) return { ok: false, error: "Non authentifié." };

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const { error } = await c.supabase
    .from("todos_perso")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", c.userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
