"use client";

import { useRouter } from "next/navigation";
import { markNotificationReadAction } from "@/lib/actions/notifications";

/** Élément de la liste des notifications : marque comme lu au clic, puis navigue. */
export function NotificationLink({
  id,
  link,
  isRead,
  children,
}: {
  id: string;
  link: string | null;
  isRead: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleClick() {
    if (!isRead) await markNotificationReadAction(id);
    if (link) router.push(link);
    else router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} className="block w-full text-left hover:opacity-80">
      {children}
    </button>
  );
}
