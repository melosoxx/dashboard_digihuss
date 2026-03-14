"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir navegacion</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0 bg-sidebar border-sidebar-border">
        <SheetTitle className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="logo-glow flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoo.png" alt="Logo" className="h-11 w-11 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">Digital Products</span>
            <span className="dashboard-glow text-[10px] font-semibold leading-none tracking-[0.25em] uppercase text-center w-full">Dashboard</span>
          </div>
        </SheetTitle>
        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
