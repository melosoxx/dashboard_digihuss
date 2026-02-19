import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { DateRangeProvider } from "@/providers/date-range-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WWH Dashboard | World Wide Hustle",
  description: "Business analytics dashboard for World Wide Hustle digital products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <DateRangeProvider>
              <TooltipProvider>
                <div className="flex h-screen overflow-hidden">
                  <Sidebar />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                      {children}
                    </main>
                  </div>
                </div>
              </TooltipProvider>
            </DateRangeProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
