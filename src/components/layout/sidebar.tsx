"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="logo-glow flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoo.png" alt="Logo" className="h-11 w-11 object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground tracking-tight">Digital Products</span>
          <span className="dashboard-glow text-[10px] font-semibold leading-none tracking-[0.25em] uppercase text-center w-full">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
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
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "sidebar-nav-icon")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-[10px] text-muted-foreground text-center">
          Digital Products Dashboard
        </p>
      </div>
    </aside>
  );
}
