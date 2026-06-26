import { createClient } from "@/lib/supabase/server";

export type TodoPerso = {
  id: string;
  texte: string;
  done: boolean;
  done_at: string | null;
};

/** Une tâche cochée n'est visible que le jour où elle a été cochée. */
function visibleAujourdhui(t: { done: boolean; done_at: string | null }): boolean {
  if (!t.done) return true;
  if (!t.done_at) return true;
  const fait = new Date(t.done_at);
  const now = new Date();
  return (
    fait.getFullYear() === now.getFullYear() &&
    fait.getMonth() === now.getMonth() &&
    fait.getDate() === now.getDate()
  );
}

/**
 * Charge le pense-bête personnel de l'utilisateur courant. Les tâches non
 * cochées d'abord, puis les cochées (barrées, en bas). Les tâches cochées un
 * jour précédent sont masquées (purge logique « le lendemain »).
 */
export async function loadTodosPerso(): Promise<TodoPerso[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("todos_perso")
    .select("id, texte, done, done_at")
    .order("done", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).filter(visibleAujourdhui);
}
