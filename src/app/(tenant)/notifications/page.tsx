import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, is_read, created_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items = notifications ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Notifications" description="Vos notifications récentes." />

      {items.length === 0 ? (
        <EmptyState title="Aucune notification" description="Vous êtes à jour." />
      ) : (
        <Card>
          <CardContent className="py-2">
            <ul className="flex flex-col divide-y">
              {items.map((n) => {
                const content = (
                  <div className={`flex flex-col gap-0.5 py-3 ${n.is_read ? "" : "font-medium"}`}>
                    <span className="flex items-center gap-2 text-sm">
                      {n.is_read ? null : <span className="size-1.5 rounded-full bg-primary" />}
                      {n.title}
                    </span>
                    {n.body ? (
                      <span className="text-muted-foreground text-xs">{n.body}</span>
                    ) : null}
                    <span className="text-muted-foreground text-[11px]">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} className="block hover:opacity-80">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
