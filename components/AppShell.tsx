"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { X, Menu, LayoutDashboard, Bot, BarChart3, PieChart, FileSpreadsheet, ShieldAlert, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const MOBILE_NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/copilot", label: "AI Copilot", icon: Bot },
  { href: "/dashboard", label: "Executive Dashboard", icon: BarChart3 },
  { href: "/analytics", label: "Charts & Analytics", icon: PieChart },
  { href: "/reports", label: "Reports & Export", icon: FileSpreadsheet },
  { href: "/data-quality", label: "Data Quality", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">
      <Sidebar />

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
                  SD
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Skylark BI</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1.5">
              {MOBILE_NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header trigger */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Skylark BI Agent</span>
        </div>

        <TopNav />

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-950/50 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
