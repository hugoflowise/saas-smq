import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { loadNotifications } from "@/lib/notifications-view";
import { NotificationLink } from "./notification-link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  // Même logique que la cloche (vue simulée incluse).
  const { notifications: items } = await loadNotifications(100);

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
                    <NotificationLink id={n.id} link={n.link} isRead={n.is_read}>
                      {content}
                    </NotificationLink>
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
