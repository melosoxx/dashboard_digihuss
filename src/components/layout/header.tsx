"use client";

import { MobileNav } from "./mobile-nav";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RefreshButton } from "@/components/shared/refresh-button";

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <MobileNav />
      <div className="flex-1" />
      <DateRangePicker />
      <RefreshButton />
      <ThemeToggle />
    </header>
  );
}
