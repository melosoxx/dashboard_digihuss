"use client";

import { useAuth } from "@/providers/auth-provider";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm text-muted-foreground">
        Administracion
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground">
          {user?.email}
        </span>
      </div>
    </header>
  );
}
