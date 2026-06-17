import Image from "next/image";
import { NavLinks } from "./nav-links";

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center border-b px-5">
        <Image
          src="/logo.png"
          alt="Flowise"
          width={500}
          height={230}
          className="h-8 w-auto"
          priority
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks isAdmin={isAdmin} />
      </div>
    </aside>
  );
}
