"use client";

import { Building2, LogOut, Menu } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { NavLinks } from "./nav-links";
import { NotificationBell, type NotificationItem } from "./notification-bell";
import { TenantSwitcher } from "./tenant-switcher";

type TopBarProps = {
  email: string;
  role: string;
  isAdmin: boolean;
  tenants: { id: string; nom: string }[];
  activeTenantId: string | null;
  activeTenantName: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
};

export function TopBar({
  email,
  role,
  isAdmin,
  tenants,
  activeTenantId,
  activeTenantName,
  notifications,
  unreadCount,
}: TopBarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-glass-border border-b glass px-4">
      <div className="flex items-center gap-2">
        {/* Menu mobile */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="flex h-14 items-center border-b px-5">
              <Image
                src="/logo.png"
                alt="Flowise"
                width={500}
                height={230}
                className="h-8 w-auto"
              />
            </SheetTitle>
            <div className="overflow-y-auto">
              <NavLinks isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Sélecteur de tenant (admin) ou tenant fixe (dirigeant) */}
        {isAdmin ? (
          <TenantSwitcher tenants={tenants} activeTenantId={activeTenantId} />
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="max-w-[12rem] truncate font-medium">{activeTenantName ?? "—"}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs uppercase">
                  {email.slice(0, 2)}
                </span>
                <span className="hidden max-w-[12rem] truncate sm:inline">{email}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate">{email}</span>
                <span className="font-normal text-muted-foreground text-xs">Rôle : {role}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
