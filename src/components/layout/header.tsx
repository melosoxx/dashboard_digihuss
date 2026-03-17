"use client";

import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RefreshButton } from "@/components/shared/refresh-button";
import { ProfileSwitcher } from "@/components/shared/profile-switcher";
import { IntegrationStatus } from "./integration-status";
import { CurrencyToggle } from "./currency-toggle";

export function Header() {
  return (
    <header className="flex h-14 items-center gap-2 sm:gap-4 border-b border-slate-200 dark:border-border bg-white/70 dark:bg-card/70 backdrop-blur-md px-3 sm:px-4 lg:px-6">
      <MobileNav />
      <CurrencyToggle />
      <div className="hidden sm:flex">
        <IntegrationStatus />
      </div>
      <div className="flex-1" />
      <ProfileSwitcher />
      <div className="hidden md:flex">
        <DateRangePicker />
      </div>
      <div className="hidden sm:flex">
        <RefreshButton />
      </div>
      <div className="hidden sm:flex">
        <ThemeToggle />
      </div>
      <UserMenu />
    </header>
  );
}
