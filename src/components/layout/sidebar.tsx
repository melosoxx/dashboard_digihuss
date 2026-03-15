"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  const expanded = hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "hidden lg:flex lg:flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out overflow-hidden",
        expanded ? "lg:w-56" : "lg:w-[60px]"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <div className={cn("flex items-center gap-2.5 min-w-0", !expanded && "justify-center w-full")}>
          <div className="logo-glow flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoo.png"
              alt="Logo"
              className={cn(
                "object-contain transition-all duration-300",
                expanded ? "h-11 w-11" : "h-8 w-8"
              )}
            />
          </div>
          <div
            className={cn(
              "flex flex-col min-w-0 transition-all duration-300",
              expanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            <span className="text-sm font-bold text-foreground tracking-tight whitespace-nowrap">Digital Products</span>
            <span className="dashboard-glow text-[10px] font-semibold leading-none tracking-[0.25em] uppercase text-center w-full whitespace-nowrap">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-0.5 transition-all duration-300", expanded ? "p-3" : "p-1.5")}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                expanded
                  ? "gap-3 px-3 py-2.5"
                  : "justify-center p-2.5",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "sidebar-nav-item hover:bg-sidebar-accent border border-transparent"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "sidebar-nav-icon")} />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap",
                  expanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          );

          if (!expanded) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-sidebar-border p-4 transition-all duration-300",
          expanded ? "opacity-100" : "opacity-0"
        )}
      >
        <p className="text-[10px] text-muted-foreground text-center whitespace-nowrap">
          Digital Products Dashboard
        </p>
      </div>
    </aside>
  );
}
