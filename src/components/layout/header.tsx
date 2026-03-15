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
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <MobileNav />
      <div className="flex-1" />
      <CurrencyToggle />
      <IntegrationStatus />
      <ProfileSwitcher />
      <DateRangePicker />
      <RefreshButton />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
