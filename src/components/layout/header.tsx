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
    <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 lg:px-6">
      <MobileNav />
      <div className="flex-1" />
      <CurrencyToggle />
      <div className="hidden sm:flex">
        <IntegrationStatus />
      </div>
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
