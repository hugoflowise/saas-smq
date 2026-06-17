import { NavLinks } from "./nav-links";

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <span className="size-3 rounded-full bg-primary" aria-hidden />
        <span className="font-semibold tracking-tight">Flowise SMQ</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks isAdmin={isAdmin} />
      </div>
    </aside>
  );
}
