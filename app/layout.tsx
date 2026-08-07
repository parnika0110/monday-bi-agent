import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Skylark BI Agent | SaaS AI Analytics Platform",
  description: "Monday.com Business Intelligence Agent & SaaS AI Analytics Platform for Skylark Drones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
