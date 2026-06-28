"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { TIMEZONE } from "@/lib/format";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleClick(n: NotificationItem) {
    if (!n.is_read) await markNotificationReadAction(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
    else router.refresh();
  }

  async function markAll() {
    await markAllNotificationsReadAction();
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="xs" onClick={markAll}>
              Tout marquer comme lu
            </Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              Aucune notification.
            </p>
          ) : (
            <ul className="flex flex-col">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted ${
                      n.is_read ? "" : "bg-primary/5"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {n.is_read ? null : <span className="size-1.5 rounded-full bg-primary" />}
                      {n.title}
                    </span>
                    {n.body ? (
                      <span className="line-clamp-2 text-muted-foreground text-xs">{n.body}</span>
                    ) : null}
                    <span className="text-muted-foreground text-[11px]">
                      {timeAgo(n.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-3 py-2 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="text-primary text-sm hover:underline"
          >
            Voir toutes les notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
