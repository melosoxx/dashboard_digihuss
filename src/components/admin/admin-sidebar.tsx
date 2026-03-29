"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Admin Panel</span>
            <span className="text-[10px] text-muted-foreground">WWH Dash</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "sidebar-nav-item hover:bg-sidebar-accent border border-transparent"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "sidebar-nav-icon"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to dashboard */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/panel"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      </div>
    </aside>
  );
}
