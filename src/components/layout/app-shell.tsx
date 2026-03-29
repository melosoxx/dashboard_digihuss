"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

const STANDALONE_PATHS = ["/login", "/signup", "/admin", "/suspended", "/pending-payment"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = STANDALONE_PATHS.some((p) => pathname.startsWith(p));

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
